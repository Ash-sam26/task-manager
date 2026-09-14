import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://picsum.photos/id/180/1600/900')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute right-6 top-6 flex gap-3">
        <Link
          href="/login"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign up
        </Link>
      </div>

      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl font-bold">Task Manager</h1>
        <p className="mt-4 text-lg text-gray-200">
          Stay organized. Get things done.
        </p>
      </div>
    </main>
  )
}