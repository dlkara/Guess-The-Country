export default async function handler(req, res) {
	try {
		const { name } = req.query;
		if (!name) return res.status(400).json({ error: 'name required' });

		const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,cca2,capital,flags,region,population`;
		const r = await fetch(url);
		if (!r.ok) return res.status(r.status).json({ error: 'restcountries error' });

		const arr = await r.json();
		const item = Array.isArray(arr) ? arr[0] : arr;

		res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
		return res.status(200).json({
			name: item?.name?.common || null,
			code: item?.cca2 || null,
			capital: item?.capital?.[0] || null,
			region: item?.region || null,
			flagPng: item?.flags?.png || null,
			flagSvg: item?.flags?.svg || null
		});
	} catch (e) {
		return res.status(500).json({ error: 'server error' });
	}
}
