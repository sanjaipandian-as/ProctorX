# CompilerPage Integration Guide

## Overview
The CompilerPage is now fully integrated with the Compiler-End backend to execute code in multiple languages (Python, C++, Java, JavaScript) using Docker containers.

## Architecture

### Frontend (CompilerPage.jsx)
- **Location**: `c:\ProctorX\Front-End\src\pages\CompilerPage.jsx`
- **Port**: Running on Vite dev server (typically port 5173)
- **Features**:
  - Monaco code editor with syntax highlighting
  - Multi-language support (Python, C++, Java, JavaScript)
  - Live timer tracking workout duration
  - Test case management (5 predefined tests)
  - Real-time output display with color-coded results
  - Loading states for better UX

### Backend (Compiler-End)
- **Location**: `c:\ProctorX\Compilor-End`
- **Port**: 4000
- **Endpoint**: `POST http://localhost:4000/run`
- **Features**:
  - Docker-based code execution for security
  - Support for multiple languages
  - Compilation error detection
  - Runtime error handling
  - Time limit enforcement
  - Memory limit enforcement

## How It Works

### 1. Single Test Execution (Run Button)
When user clicks "Run":
1. Frontend sends POST request to `http://localhost:4000/run` with:
   ```json
   {
     "language": "python",
     "code": "user's code here",
     "tests": [
       { "input": "test input data" }
     ]
   }
   ```

2. Backend:
   - Creates temporary directory for the job
   - Writes code to appropriate file (main.py, main.cpp, Main.java, main.js)
   - Compiles code if needed (C++, Java)
   - Runs code in isolated Docker container
   - Returns results

3. Frontend displays:
   - Compilation errors (if any)
   - Runtime errors (if any)
   - Time limit exceeded (if applicable)
   - Actual output

### 2. All Tests Execution (Run Tests Button)
When user clicks "Run Tests":
1. Frontend sends all 5 test cases in a single request:
   ```json
   {
     "language": "python",
     "code": "user's code here",
     "tests": [
       { "input": "test 1 input" },
       { "input": "test 2 input" },
       { "input": "test 3 input" },
       { "input": "test 4 input" },
       { "input": "test 5 input" }
     ]
   }
   ```

2. Backend runs all tests sequentially and returns results for each

3. Frontend:
   - Compares actual output with expected output
   - Shows ✓ (green) for passed tests
   - Shows ✗ (red) for failed tests
   - Updates the output panel with results

## API Response Format

### Success Response
```json
{
  "jobId": "uuid-here",
  "language": "python",
  "compile": {
    "code": 0,
    "stdout": "",
    "stderr": "",
    "killed": false
  },
  "tests": [
    {
      "index": 0,
      "input": "4\n2 3\n2 1 4 3",
      "stdout": "3\n",
      "stderr": "",
      "code": 0,
      "signal": null,
      "killed": false
    }
  ]
}
```

### Error Scenarios

#### Compilation Error (C++/Java)
```json
{
  "compile": {
    "code": 1,
    "stderr": "main.cpp:5:1: error: expected ';' before '}' token"
  }
}
```

#### Runtime Error
```json
{
  "tests": [{
    "code": 1,
    "stderr": "Traceback (most recent call last):\n  File \"main.py\", line 5, in <module>\n    result = 1/0\nZeroDivisionError: division by zero"
  }]
}
```

#### Time Limit Exceeded
```json
{
  "tests": [{
    "killed": true,
    "code": 124
  }]
}
```

## Current Test Cases

The page includes 5 predefined test cases for the "Count Subarrays" problem:

| Test # | Input | Expected Output |
|--------|-------|----------------|
| 1 | `4\n2 3\n2 1 4 3` | `3` |
| 2 | `5\n1 2\n1 2 3 4 5` | `8` |
| 3 | `3\n2 4\n2 5 3` | `2` |
| 4 | `4\n3 6\n3 6 1 2` | `3` |
| 5 | `5\n2 5\n1 2 5 3 4` | `6` |

## Setup & Running

### Prerequisites
1. Docker must be installed and running
2. Docker images must be built:
   - `proctorx/python-runner:latest`
   - `proctorx/gcc-runner:latest`
   - `proctorx/java-runner:latest`
   - `proctorx/node-runner:latest`

### Starting the Services

1. **Start Compiler-End Backend**:
   ```bash
   cd c:\ProctorX\Compilor-End
   npm start
   ```
   Should see: `compiler service listening on 4000`

2. **Start Frontend**:
   ```bash
   cd c:\ProctorX\Front-End
   npm run dev
   ```

3. **Navigate to CompilerPage** in your browser

## Recent Changes

### Backend Changes
1. ✅ Added CORS support to allow cross-origin requests from frontend
2. ✅ Added `cors` package to dependencies

### Frontend Changes
1. ✅ Updated API calls to use correct format with `tests` array
2. ✅ Added loading states (`isRunning`, `isRunningTests`)
3. ✅ Improved error handling with detailed error messages
4. ✅ Added compilation error detection
5. ✅ Added time limit exceeded detection
6. ✅ Color-coded output (green for pass, red for fail, gray for no output)
7. ✅ Fixed timer state management (renamed to `timerRunning`)
8. ✅ Disabled buttons during execution to prevent multiple submissions

## Troubleshooting

### Issue: CORS Error
**Solution**: Make sure the Compiler-End server has been restarted after adding CORS support.

### Issue: "Failed to run code"
**Possible causes**:
1. Compiler-End server not running
2. Docker not running
3. Docker images not built
4. Network connectivity issues

**Check**:
```bash
# Check if server is running
curl http://localhost:4000/run

# Check if Docker is running
docker ps

# Check if images exist
docker images | grep proctorx
```

### Issue: "Time Limit Exceeded"
**Solution**: The default time limit is 5000ms (5 seconds). If your code needs more time, update the `.env` file in Compiler-End:
```
DEFAULT_TIME_MS=10000
```

### Issue: Compilation errors not showing
**Solution**: Check the browser console for the full response. The backend returns detailed compilation errors in `res.data.compile.stderr`.

## Next Steps / Enhancements

1. **Add more test cases**: Modify the `tests` array in CompilerPage.jsx
2. **Custom input**: Add a text area for users to provide custom input
3. **Save code**: Add functionality to save code to backend/database
4. **Code templates**: Provide starter templates for each language
5. **Syntax validation**: Add client-side syntax checking before submission
6. **Performance metrics**: Show execution time and memory usage
7. **Code history**: Track previous submissions
8. **Leaderboard**: Compare performance with other users

## File Structure
```
ProctorX/
├── Front-End/
│   └── src/
│       └── pages/
│           └── CompilerPage.jsx    # Main compiler UI
├── Compilor-End/
│   ├── src/
│   │   ├── index.js               # Express server with CORS
│   │   ├── runner.js              # Docker execution logic
│   │   └── utils.js               # Utility functions
│   ├── .env                       # Configuration
│   └── package.json               # Dependencies (includes cors)
└── COMPILER_INTEGRATION.md        # This file
```

## Support
For issues or questions, check:
1. Browser console for frontend errors
2. Compiler-End terminal for backend errors
3. Docker logs: `docker logs <container-id>`
