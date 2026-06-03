import React from 'react'

const About = () => {
  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-5xl mx-auto px-4 md:px-16 lg:px-28 py-16">
        <h1 className="text-4xl font-bold mb-4">About YemenBus</h1>
        <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-300">
          YemenBus is a simple online bus ticket booking platform designed to make travel planning easy. We connect you with reliable bus routes and seating options across major destinations.
        </p>
      </div>
    </main>
  )
}

export default About
