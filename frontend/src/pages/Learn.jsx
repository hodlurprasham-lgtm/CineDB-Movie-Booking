import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, PlusSquare, Edit, Trash2, Search, Key, Link as LinkIcon, Sigma, CheckSquare, List, FastForward, ChevronDown, ChevronRight, Play } from 'lucide-react';

const TOPICS = [
  {
    id: 'ddl', title: 'What is DDL? (Data Definition)', icon: PlusSquare,
    content: `Data Definition Language (DDL) is used to define the database structure or schema.\n\nKey commands:\n- **CREATE**: Creates a new table, view, or object.\n- **ALTER**: Modifies an existing database object.\n- **DROP**: Deletes an entire table or object.\n\nIn our app, the \`movies\` and \`bookings\` tables are created using DDL.`,
    sql: `CREATE TABLE IF NOT EXISTS demo_reviews (\n  review_id INTEGER PRIMARY KEY,\n  movie_id INTEGER,\n  review_text TEXT\n);`
  },
  {
    id: 'dml', title: 'What is DML? (Data Manipulation)', icon: Edit,
    content: `Data Manipulation Language (DML) manages data within schema objects.\n\nKey commands:\n- **INSERT**: Adds new rows of data.\n- **UPDATE**: Modifies existing data.\n- **DELETE**: Removes existing rows.\n\nWhen you book a ticket or add a new movie, the app executes DML commands.`,
    sql: `INSERT INTO demo_reviews (movie_id, review_text)\nVALUES (1, 'Great movie!');`
  },
  {
    id: 'dql', title: 'What is DQL? (Data Querying)', icon: Search,
    content: `Data Query Language (DQL) is used to retrieve data from the database. \`SELECT\` is the primary DQL command.\n\nClauses:\n- **WHERE**: Filters rows based on conditions.\n- **ORDER BY**: Sorts the result set.\n- **LIMIT**: Restricts the number of returned rows.`,
    sql: `SELECT title, genre, rating FROM movies\nWHERE rating > 8.0 ORDER BY rating DESC;`
  },
  {
    id: 'keys', title: 'Primary & Foreign Keys', icon: Key,
    content: `**Primary Key (PK)**: A unique identifier for a row in a table. E.g., \`customer_id\` in \`customers\`.\n\n**Foreign Key (FK)**: A column that references a primary key in another table, creating a relationship. E.g., \`customer_id\` in the \`bookings\` table references the \`customers\` table, ensuring a booking always belongs to a valid customer.`,
    sql: `SELECT b.booking_id, c.name \nFROM bookings b \nJOIN customers c ON b.customer_id = c.customer_id;`
  },
  {
    id: 'joins', title: 'Joins Explained', icon: LinkIcon,
    content: `JOINs combine rows from two or more tables based on a related column.\n\n- **INNER JOIN**: Returns records that have matching values in both tables.\n- **LEFT JOIN**: Returns all records from the left table, and matched records from the right (or NULL if no match).\n\nIn CineDB, to show booking details, we JOIN bookings, customers, and shows.`,
    sql: `SELECT m.title, s.show_date \nFROM movies m \nINNER JOIN shows s ON m.movie_id = s.movie_id;`
  },
  {
    id: 'agg', title: 'Aggregate Functions', icon: Sigma,
    content: `Aggregates perform a calculation on a set of values and return a single value.\n\n- **COUNT()**: Number of rows.\n- **SUM()**: Total sum of a numeric column.\n- **AVG()**: Average value.\n- **GROUP BY**: Groups rows that have the same values into summary rows.`,
    sql: `SELECT m.title, COUNT(b.booking_id) AS total_bookings, SUM(b.total_amount) AS revenue\nFROM movies m\nJOIN shows s ON m.movie_id = s.movie_id\nJOIN bookings b ON s.show_id = b.show_id\nGROUP BY m.title;`
  },
  {
    id: 'normalization', title: 'Normalization', icon: List,
    content: `Normalization organizes tables to reduce data redundancy and improve data integrity.\n\n- **1NF**: Atomic values (no arrays in a column). We separate genres into \`movie_genres\` instead of a comma-separated string.\n- **2NF**: No partial dependency. \n- **3NF**: No transitive dependency.`,
    sql: `SELECT 'Check the schema visualization to see normalization in action!' AS message;`
  },
  {
    id: 'transactions', title: 'Transactions (ACID)', icon: CheckSquare,
    content: `A transaction is a single logical unit of work. It follows ACID properties (Atomicity, Consistency, Isolation, Durability).\n\nWhen booking seats, we:\n1. BEGIN TRANSACTION\n2. Insert the booking\n3. Insert selected seats into booking_seats\n4. Update seat availability\n5. COMMIT (or ROLLBACK if error occurs)`,
    sql: `BEGIN TRANSACTION;\n-- queries go here\nCOMMIT;`
  },
  {
    id: 'indexes', title: 'Indexes', icon: FastForward,
    content: `An index is a data structure that improves the speed of data retrieval operations on a table at the cost of slower writes and more storage.\n\nBy creating an index on \`shows(show_date)\`, the database can quickly find shows for a specific date without scanning the entire table.`,
    sql: `CREATE INDEX idx_movies_rating ON movies(rating);`
  }
];

const Learn = () => {
  const [expanded, setExpanded] = useState('ddl');
  const navigate = useNavigate();

  const handleOpenPlayground = (sql) => {
    // In a real app, we might pass this via context or localstorage
    // For now, we just navigate. The SQL Playground has examples built-in.
    navigate('/sql');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Learn DBMS Concepts</h1>
        <p className="text-slate-400 text-lg">Understand how relational databases work behind the scenes of CineDB.</p>
      </div>

      <div className="space-y-4">
        {TOPICS.map((topic) => (
          <div key={topic.id} className={`bg-navy-800 border rounded-xl overflow-hidden transition-colors ${expanded === topic.id ? 'border-cinered' : 'border-navy-700 hover:border-navy-600'}`}>
            <button 
              onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${expanded === topic.id ? 'bg-cinered text-white' : 'bg-navy-900 text-slate-400'}`}>
                  <topic.icon size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">{topic.title}</h2>
              </div>
              <div className="text-slate-400">
                {expanded === topic.id ? <ChevronDown /> : <ChevronRight />}
              </div>
            </button>
            
            {expanded === topic.id && (
              <div className="px-6 pb-6 pt-2 border-t border-navy-700/50">
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap mb-6">
                  {topic.content}
                </div>
                
                <div className="bg-[#0d1117] rounded-lg border border-navy-700 overflow-hidden">
                  <div className="bg-navy-900 px-4 py-2 text-xs font-mono text-slate-400 border-b border-navy-700 flex justify-between items-center">
                    <span>Example Query</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-green-400"><code>{topic.sql}</code></pre>
                  </div>
                  <div className="bg-navy-900 p-2 flex justify-end">
                    <button 
                      onClick={() => handleOpenPlayground(topic.sql)}
                      className="px-4 py-1.5 bg-navy-700 hover:bg-navy-600 text-white text-sm rounded flex items-center gap-2 transition-colors"
                    >
                      <Play size={14} /> Try in Playground
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learn;
