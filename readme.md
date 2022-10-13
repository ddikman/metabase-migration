# Metabase migration scripts

All creds to [Robin Jain](https://blog.koverhoop.com/import-and-export-contents-of-one-metabase-instance-to-another-b79d1858ca37) who shared these scripts in his blog post on the topic.

This simple edits the scripts a little bit and documents them for my own purpose.

## Changes made
- Hostname, username and password are taken from environment variables to avoid having to edit files
- Source cards are imported even if they don't belong to a collection
- Errors are written to console on failure

## Other notes

When you move instances you also need to move the databases. There is no mapping for the databases right now so I would like to add this.

On export, the database id should be noted and replaced with the database id matching the same name on the new instance.

When I ran this I manually edited all instances of `database_id` and `database` to be correct.