async function testCors() {
    console.log('Sending OPTIONS preflight request to running server...');
    const url = 'http://localhost:3001/api/conversations';
    
    try {
        const res = await fetch(url, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'content-type,x-user-id,x-user-role,authorization'
            }
        });
        
        console.log(`Status: ${res.status} ${res.statusText}`);
        console.log('Response Headers:');
        res.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
    } catch (err: any) {
        console.error('OPTIONS request failed:', err.message);
    }
}

testCors();
