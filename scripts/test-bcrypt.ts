import bcrypt from 'bcryptjs';

async function test() {
    const password = '123';
    const hash = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(password, hash);
    console.log('Match?', match);
    console.log('Hash:', hash);
}

test();
