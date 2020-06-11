import { ApolloServer, gql } from 'apollo-server-micro'
import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql' 

import {
  GraphQLDate,
  GraphQLTime,
  GraphQLDateTime
} from 'graphql-iso-date'

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
  const { exec } = require('child_process')

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
      }
      resolve(stdout? stdout : stderr)
    })
  })
}

const logger = console.log

const typeDefs = gql`
  scalar Date

  type Task {
    uuid: ID!
    description: String
    entry: Date
    modified: Date
    status: String
    urgency: Float
  }

  type Query {
    tasks(filter: String, context: String): [Task]
  }

  type Mutation {
    modifyTask(uuid: ID, status: String): Task
    addTask(description: String): String
    syncTasks: String
  }
` 

const resolvers = {
  Query: {
    tasks: async (a,s,d,f) => {
      let string = '-HACK_TO_SHOW_ALL '

      if (s.context) {
        const contextFilters =`grep "context.${s.context}" /home/node/.taskrc | cut -d \'=\' -f 2`
        const context = await execShellCommand(contextFilters)

        string = `${string} \\(${context.trim()}\\)`
      }

      if (s.filter) {
        string = `${string} ${s.filter}`
      }

      const cmd = `/usr/bin/task ${string} export`
      logger(cmd)

      const jsonString = await execShellCommand(cmd)
      return JSON
        .parse(jsonString)
        .sort((a, b) => b.urgency - a.urgency)
    },
  },

  Mutation: {
    addTask: async (a,s,d,f) => {
      await execShellCommand(`/usr/bin/task add ${s.description}`)
      return 'ok'
    },


    syncTasks: async (a,s,d,f) => {
      await execShellCommand('/usr/bin/task sync')
      return 'ok'
    },

    modifyTask: async (a,s,d,f) => {
      await execShellCommand(`/usr/bin/task ${s.uuid} modify status:${s.status}`)
      const x = await execShellCommand(`/usr/bin/task rc.json.array=off ${s.uuid} export`)
      return JSON.parse(x)
    }
  } 
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers
})

const handler = apolloServer.createHandler({ path: '/api/graphql' })

export const config = {
  api: {
    bodyParser: false
  }
}

export default handler
