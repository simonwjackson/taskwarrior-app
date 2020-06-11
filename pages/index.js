import React from 'react'
import Head from 'next/head'
import { useQuery , useMutation} from '@apollo/react-hooks'
import gql from 'graphql-tag'

const TASKS_QUERY = gql`
    {
      tasks(filter:"-DELETED") {
        uuid
        description
        entry
        modified
        status
        urgency
      }
    }
`

const UPDATE_TODO = gql`
   mutation ModifyTask($uuid: ID!, $status: String) {
      modifyTask(uuid: $uuid, status: $status) {
        uuid
        description
        entry
        modified
        status
        urgency
      }
    }
`

const sortDateAsc = (a,b) => (a.entry < b.entry) ? -1 : ((a.entry > b.entry) ? 1 : 0)

const Home = () => {
  const { data, loading, error } = useQuery(TASKS_QUERY)
  const [ modifyTask ] = useMutation(UPDATE_TODO, {
    update(cache, { data }) {
      const { tasks } = cache.readQuery({ query: TASKS_QUERY })

      cache.writeQuery({
        query: TASKS_QUERY,
        data: { tasks: tasks
          .filter(task => task.uuid !== data.modifyTask.uuid)
          .concat(data.modifyTask)
        },
      })
    }
  })

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>Error: {JSON.stringify(error)}</p>
  }

  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ul>
        {data.tasks
          .slice()
          // .sort(sortDateAsc)
          .map(task => {
            // let input

            return <li key={task.uuid}>
              <input 
                //  ref={node => {
                //   input = node;
                // }}
                type="checkbox" 
                checked={task.status === 'completed'}
                onChange={e => {
                  e.preventDefault()
                  task.status === 'completed'
                    ? modifyTask({ variables: { 
                      uuid: task.uuid ,
                      status: 'pending'
                    }})
                    : modifyTask({ variables: { 
                      uuid: task.uuid ,
                      status: 'complete'
                    }})

                }}
              />{task.description}</li>
          })}
      </ul>
    </div>
  )
}

export default Home
