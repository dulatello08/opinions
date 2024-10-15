import { NextResponse } from 'next/server';

async function POST(request: Request): Promise<Response> {
    try {
        const body = await request.json();
        const { gradeLevel, opinion, nameOption, name } = body;

        // Handle data, e.g., save to a database or process it
        console.log({ gradeLevel, opinion, nameOption, name });

        return NextResponse.json({ message: 'Data received successfully' });
    } catch {
        return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
    }
}

export { POST };