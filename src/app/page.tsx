import Link from 'next/link'
import Image from 'next/image'

// Testemunhos falsos para prova social (apenas mulheres, sem imagens externas)
const TESTIMONIALS = [
  {
    name: 'Mariana Silva',
    role: 'Paciente há 3 meses',
    content: 'A Nutri-IA me ajudou muito a entender as substituições do meu cardápio. Agora não fico perdida quando falta algum ingrediente!',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    role: 'Paciente há 1 mês',
    content: 'Maravilhoso! Consigo tirar dúvidas na hora que estou no mercado. Facilitou demais minha reeducação alimentar.',
    rating: 5,
  },
  {
    name: 'Fernanda Santos',
    role: 'Paciente há 6 meses',
    content: 'Adorei a facilidade de saber o que comer antes do treino sem precisar mandar mensagem toda hora. Muito prático.',
    rating: 4,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/20 flex flex-col">
      {/* Header / Navbar */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo Colorida - Maior e com Nome */}
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                <Image src="/logo-colorida.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hidden sm:block">
                Reeduca-IA
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary font-medium transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="hidden sm:inline-flex btn-primary py-2.5 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
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

        {/* Testimonials - Prova Social (Apenas Mulheres, sem foto) */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">O que nossas pacientes dizem</h2>
              <p className="text-muted text-lg">Histórias reais de quem transformou sua alimentação</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 relative hover:-translate-y-1 transition-transform duration-300">
                  {/* Aspas */}
                  <div className="absolute top-6 right-8 text-6xl text-primary/10 font-serif">"</div>

                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(5)].map((_, starI) => (
                      <svg key={starI} className={`w-5 h-5 ${starI < testimonial.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-gray-600 italic mb-8 relative z-10 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>

                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                      </div>
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
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="relative w-8 h-8">
              <Image src="/logo-colorida.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-gray-700">Reeduca-IA</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 Reeduca.IA - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
