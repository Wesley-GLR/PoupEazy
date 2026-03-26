import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white font-heading">
            P
          </div>
          <h1 className="text-4xl font-bold text-black font-heading">PoupEazy</h1>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
