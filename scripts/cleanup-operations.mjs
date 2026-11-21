import pg from "pg";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL missing");
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 const errors=await client.query("DELETE FROM app_error_events WHERE created_at < now()-interval '30 days'");
 const vitals=await client.query("DELETE FROM web_vitals WHERE created_at < now()-interval '30 days'");
 const notices=await client.query("DELETE FROM admin_notifications WHERE created_at < now()-interval '90 days'");
 console.log({oldErrors:errors.rowCount,oldVitals:vitals.rowCount,oldNotifications:notices.rowCount});
}finally{await client.end()}
