# Dependencies & Setup Guide

## Frontend (Next.js) - npm

All dependencies are already specified in `package.json`. No new packages were added for the real-time collaboration feature.

### To install all dependencies:

```bash
npm install
```

### Key packages being used:

- **@supabase/supabase-js** (^2.99.1) - Real-time WebSocket sync
- **zustand** (^5.0.11) - State management
- **@xyflow/react** (^12.10.1) - Graph visualization
- **prisma** (^5.22.0) - Database ORM
- **next** (14.2.35) - Framework
- **react** (^18.3.1) - UI library

### To run development server:

```bash
npm run dev
```

### To build for production:

```bash
npm run build
npm start
```

## Backend (Python) - pip

There's a separate Python backend for AI/RAG. Install dependencies with:

```bash
cd backend-ai
pip install -r requirements.txt
```

### To activate Python environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## Database Setup

### Prerequisites:

- PostgreSQL database (provided by Supabase)
- Prisma client installed (npm install)

### To apply database migrations:

```bash
npx prisma migrate deploy
```

### To generate Prisma client:

```bash
npx prisma generate
```

### To view database in Prisma Studio:

```bash
npx prisma studio
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=postgresql://user:password@host/dbname
DIRECT_URL=postgresql://user:password@host/dbname
```

## Complete Setup Steps

```bash
# 1. Install npm dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Start development server
npm run dev

# 6. (Optional) Set up Python backend
cd backend-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Verification

### Frontend is ready when:

- `npm run dev` runs without errors
- Browser opens to http://localhost:3000
- No TypeScript errors: `npm run lint`

### Backend is ready when:

- Python environment is activated
- All pip packages installed successfully
- `python main.py` starts without errors

### Real-time sync is working when:

- Open the same case in 2 browser tabs
- Make a change in Tab A
- Change appears instantly in Tab B ✅

## Package Versions

### Production Dependencies

```
@prisma/client: ^5.22.0
@supabase/supabase-js: ^2.99.1
@xyflow/react: ^12.10.1
next: 14.2.35
prisma: ^5.22.0
react: ^18.3.1
zustand: ^5.0.11
```

### Development Dependencies

```
@types/node: ^20
@types/react: ^18
eslint: ^8
typescript: ^5
```

## Quick Command Reference

| Command                                            | Purpose                     |
| -------------------------------------------------- | --------------------------- |
| `npm install`                                      | Install all dependencies    |
| `npm run dev`                                      | Start dev server            |
| `npm run build`                                    | Build for production        |
| `npm run lint`                                     | Run linter                  |
| `npx prisma migrate deploy`                        | Apply database migrations   |
| `npx prisma studio`                                | Open database viewer        |
| `cd backend-ai && pip install -r requirements.txt` | Install Python dependencies |

## Troubleshooting

**Dependencies not installing?**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database connection errors?**

```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test Prisma connection
npx prisma db execute --stdin < /dev/null
```

**Port 3000 already in use?**

```bash
# Use different port
npm run dev -- -p 3001
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Flow Documentation](https://reactflow.dev)
