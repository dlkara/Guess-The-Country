export default async function handler(req, res) {
	try {
		const { lat, lng } = req.query;
		if (!lat || !lng) return res.status(400).json({ error: 'lat,lng required' });

		const email = process.env.CONTACT_EMAIL || 'contact@example.com';
		const url = new URL('https://nominatim.openstreetmap.org/reverse');
		url.searchParams.set('lat', lat);
		url.searchParams.set('lon', lng);
		url.searchParams.set('format', 'json');
		url.searchParams.set('zoom', '3');
		url.searchParams.set('accept-language', 'en');

		const r = await fetch(url, {
			headers: { 'User-Agent': `myweb/1.0 (${email})`, 'From': email }
		});
		if (!r.ok) return res.status(r.status).json({ error: 'nominatim error' });
		const data = await r.json();

		res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
		return res.status(200).json({
			country: data.address?.country || null,
			code: (data.address?.country_code || '').toUpperCase() || null
		});
	} catch (e) {
		return res.status(500).json({ error: 'server error' });
	}
}
