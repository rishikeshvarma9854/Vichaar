export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full mb-6 animate-bounce-gentle">
          <div className="w-10 h-10 bg-white rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          KMIT VICHAAR
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Loading your academic portal...
        </p>
      </div>
    </div>
  )
}
