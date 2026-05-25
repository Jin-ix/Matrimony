async function testInvalidUuid() {
    const API = 'http://localhost:3001/api';
    
    // Test with 'undefined'
    try {
        console.log("Fetching /api/conversations with x-user-id: 'undefined'...");
        const res = await fetch(`${API}/conversations`, {
            headers: {
                'x-user-id': 'undefined',
                'x-user-role': 'candidate'
            }
        });
        
        console.log(`Status: ${res.status} ${res.statusText}`);
        const body = await res.text();
        console.log(`Body: ${body}`);
    } catch (err: any) {
        console.error('Fetch error:', err.message);
    }

    // Test with 'null'
    try {
        console.log("\nFetching /api/conversations with x-user-id: 'null'...");
        const res = await fetch(`${API}/conversations`, {
            headers: {
                'x-user-id': 'null',
                'x-user-role': 'candidate'
            }
        });
        
        console.log(`Status: ${res.status} ${res.statusText}`);
        const body = await res.text();
        console.log(`Body: ${body}`);
    } catch (err: any) {
        console.error('Fetch error:', err.message);
    }
}

testInvalidUuid();
