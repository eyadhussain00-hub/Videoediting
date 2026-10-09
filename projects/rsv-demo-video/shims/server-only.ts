// Next.js supplies "server-only" itself; outside Next there is no such package. The recorder calls the
// app's real report engine (src/lib/report*.ts), which starts with import "server-only", so the name is
// mapped here (tsconfig paths) to this empty module. It only exists to stop client bundles importing
// server code, which a Node script can't do anyway.
export {};
