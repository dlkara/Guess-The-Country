export default async function handler(req, res) {
	try {
		const country = (req.query.country || '').trim();
		if (!country) return res.status(400).json({ error: 'country required' });

		const key = process.env.UNSPLASH_ACCESS_KEY;
		if (!key) return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY missing' });

		const url = new URL('https://api.unsplash.com/search/photos');
		url.searchParams.set('query', `${country} landmark`);
		url.searchParams.set('orientation', 'landscape');
		url.searchParams.set('per_page', '1');

		const r = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
		if (!r.ok) return res.status(r.status).json({ error: 'unsplash error' });

		const data = await r.json();
		const photo = data.results?.[0];

		res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
		return res.status(200).json(photo ? {
			url: photo.urls?.regular,
			thumb: photo.urls?.thumb,
			alt: photo.alt_description || '',
			author: photo.user?.name,
			profile: photo.user?.links?.html,
			link: photo.links?.html
		} : { url: null });
	} catch (e) {
		return res.status(500).json({ error: 'server error' });
	}
}
