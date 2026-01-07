#!/usr/bin/env node

/**
 * Test script to verify Compiler-End API is working
 * Run this with: node test-compiler.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/run';

async function testPythonCode() {
    console.log('🧪 Testing Python code execution...\n');

    try {
        const response = await axios.post(API_URL, {
            language: 'python',
            code: `def count_subarrays(nums, left, right):
    # TODO: Implement the logic here
    return 0

if __name__ == "__main__":
    n = int(input())
    left, right = map(int, input().split())
    nums = list(map(int, input().split()))
    result = count_subarrays(nums, left, right)
    print(result)`,
            tests: [
                { input: '4\n2 3\n2 1 4 3' }
            ]
        });

        console.log('✅ Response received!');
        console.log('Job ID:', response.data.jobId);
        console.log('Language:', response.data.language);

        if (response.data.compile) {
            console.log('\n📦 Compilation:');
            console.log('  Exit code:', response.data.compile.code);
            if (response.data.compile.stderr) {
                console.log('  Errors:', response.data.compile.stderr);
            }
        }

        if (response.data.tests && response.data.tests.length > 0) {
            console.log('\n🏃 Test Results:');
            response.data.tests.forEach((test, index) => {
                console.log(`\n  Test ${index + 1}:`);
                console.log('    Exit code:', test.code);
                console.log('    Output:', test.stdout.trim() || '(empty)');
                if (test.stderr) {
                    console.log('    Errors:', test.stderr);
                }
                console.log('    Killed:', test.killed);
            });
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  Could not connect to Compiler-End server.');
            console.error('   Make sure the server is running on port 4000:');
            console.error('   cd c:\\ProctorX\\Compilor-End && npm start');
        }
    }
}

// Run the test
testPythonCode();
