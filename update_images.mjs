import http from 'http';

const fetchLocal = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data || '{}')));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const map = [
    { contains: 'alfajor', url: '/alfajor.svg' },
    { contains: 'yerba', url: '/yerba.svg' },
    { contains: 'lays', url: '/papas.svg' },
    { contains: 'coca', url: '/coca.svg' }
];

async function update() {
    try {
        const productos = await fetchLocal('/api/productos');
        for (const p of productos) {
            for (const m of map) {
                if ((p.nombre || '').toLowerCase().includes(m.contains)) {
                    await fetchLocal('/api/productos/' + p.id, 'PUT', { ...p, imagenUrl: m.url });
                    console.log('Updated', p.nombre, 'with', m.url);
                    break;
                }
            }
        }
        console.log('Done mapping images!');
    } catch (e) {
        console.error('Error:', e.message);
    }
}
update();
