import Link from 'next/link'
import Image from 'next/image'

// Testemunhos falsos para prova social
const TESTIMONIALS = [
  {
    name: 'Mariana Silva',
    role: 'Paciente há 3 meses',
    content: 'A Nutri-IA me ajudou muito a entender as substituições do meu cardápio. Agora não fico perdida quando falta algum ingrediente!',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    name: 'Carlos Oliveira',
    role: 'Paciente há 1 mês',
    content: 'Increável como ela responde rápido e com precisão sobre o meu plano alimentar. É como ter a nutri no bolso o tempo todo.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Fernanda Santos',
    role: 'Paciente há 6 meses',
    content: 'Adorei a facilidade de tirar dúvidas sobre o que comer antes do treino. Melhorou muito meus resultados!',
    rating: 4,
    image: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/10 flex flex-col">
      {/* Header / Navbar */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo Colorida no Header */}
            <div className="relative w-40 h-12">
              <Image src="/logo-colorida.png" alt="Reeduca.IA" fill className="object-contain object-left" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary font-medium transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary py-2.5 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              Começar Agora
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-primary/5 to-transparent -z-10 rounded-bl-[100px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-in-up">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Nutricionista Carla Dantas</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary mb-6 tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Sua nutrição <br />
              <span className="text-gray-900">inteligente e personalizada</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Tire dúvidas sobre seu cardápio, descubra substituições de alimentos e receba dicas personalizadas com a ajuda da Inteligência Artificial.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/cadastro" className="w-full sm:w-auto btn-primary py-4 px-8 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                Começar Agora
              </Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:border-primary hover:text-primary hover:bg-gray-50 transition-all">
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🥗',
                  title: 'Cardápios Inteligentes',
                  desc: 'Envie seu plano alimentar em PDF e converse com a IA sobre ele.'
                },
                {
                  icon: '💬',
                  title: 'Chat 24h',
                  desc: 'Tire dúvidas sobre alimentos e substituições a qualquer momento.'
                },
                {
                  icon: '📱',
                  title: 'Acesso Fácil',
                  desc: 'Tudo na palma da sua mão, sem aplicativos pesados.'
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all group">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Prova Social (Substituindo o box branco) */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">O que nossos pacientes dizem</h2>
              <p className="text-muted text-lg">Histórias reais de quem transformou sua alimentação</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
                  {/* Aspas */}
                  <div className="absolute top-6 right-8 text-6xl text-primary/10 font-serif">"</div>

                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(5)].map((_, starI) => (
                      <svg key={starI} className={`w-5 h-5 ${starI < testimonial.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-gray-700 italic mb-8 relative z-10 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center space-x-4 border-t border-gray-100 pt-6">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                      {/* Using generic avatar since external images might break or be blocked */}
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <Image src="/logo-colorida.png" alt="Logo" width={120} height={40} className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Reeduca.IA - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
