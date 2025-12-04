# nuqtaplus Backend - Production Build

## Installation

1. Install dependencies:
   ```bash
   npm install --production
   ```

2. Configure environment:
   - Copy `.env.example` to `.env`
   - Update the configuration values

3. Start the server:
   ```bash
   node start.js
   ```
   
   Or using npm:
   ```bash
   npm start
   ```

## Database

The SQLite database will be created automatically in the `data` directory on first run.

## Port

Default port is 3050. Change via PORT environment variable in .env file.
