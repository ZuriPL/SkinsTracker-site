import clientPromise from '$lib/mongodb-client'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { serialize } from 'cookie'

export async function post({ request }) {
	const dbConnection = await clientPromise
	const db = dbConnection.db('SkinsTracker')
	const collection = db.collection('SkinsTracker')

	const data = await collection.findOne({ _id: ObjectId('62923f1b36006ed1642ff7d5') })

	let body = await request.json()

	let user = data.users.filter((user) => user.session == request.headers.get('cookie')?.split('=')[1])[0]

	if (user == undefined || !(await bcrypt.compare(body.password, user.password))) {
		return {
			status: 200,
			body: { error: 'Invalid password' },
		}
	}

	let cookie = uuidv4()

	await collection.updateOne(
		{ _id: ObjectId('62923f1b36006ed1642ff7d5'), 'users.session': request.headers.get('cookie')?.split('=')[1] },
		{
			$set: {
				'users.$.email': body.email,
				'users.$.session': cookie,
			},
		}
	)

	return {
		status: 200,
		body: {
			msg: 'Succesfully changed email',
			user: (await collection.findOne({ _id: ObjectId('62923f1b36006ed1642ff7d5') })).users.filter(
				(user) => user.session == cookie
			)[0],
		},
		headers: {
			'Set-Cookie': serialize('session', cookie, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7,
			}),
			'Cache-Control': 'no-store, no-cache',
		},
	}
}
