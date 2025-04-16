import EchoChatParticles from "../echo-chat-particles"

export default function Page() {
  return (
    <main className="min-h-screen">
      <section className="h-screen">
        <EchoChatParticles />
      </section>
      <section className="h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">The Story Begins</h2>
          <p className="text-xl md:text-2xl leading-relaxed">
            As you step through the threshold of possibility, Echo Chat reveals a new dimension of conversation. Here,
            language transcends its boundaries, and ideas flow with unprecedented clarity.
          </p>
        </div>
      </section>
    </main>
  )
}
