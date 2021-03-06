import bcrypt from 'bcryptjs'

export async function get({ params }) {
	return {
		status: 200,
		body: { msg: await bcrypt.hash(params.pswd, 10) },
	}
}
