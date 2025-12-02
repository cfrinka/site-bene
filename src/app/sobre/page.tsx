import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { H1, H2, Text } from "@/components/ui/Typography";
import PageHeader from "@/components/content/PageHeader";

export default function SobrePage() {
  return (
    <main className="min-h-screen">
      <PageHeader page="sobre" />

      {/* Story Section */}
      <section className="py-20 bg-white">
        <Container className="max-w-4xl">
          <div className="text-center">
            <H1 className="mb-6">Nossa História</H1>
            <Text className="text-lg leading-relaxed">
              Na Benê Brasil, cada peça conta uma história. Nascemos do desejo de celebrar a cultura brasileira
              através da moda, misturando ritmo, cor e liberdade em cada criação. Somos mais que uma marca de
              roupas — somos um movimento que valoriza a autenticidade, a arte urbana e o estilo único do Brasil.
            </Text>
          </div>
        </Container>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-neutral-50">
        <Container>
          <H2 className="text-center mb-16">Nossos Valores</H2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {[
              {
                icon: "🎨",
                title: "Manifesto",
                description: "Vestir é expressão. Cada estampa é um grito de identidade, cada cor carrega uma energia. Não seguimos tendências: criamos movimentos que refletem a essência brasileira."
              },
              {
                icon: "🌱",
                title: "Sustentabilidade",
                description: "Parcerias locais, materiais responsáveis e produção consciente. Cuidamos do que vestimos, de quem faz e do planeta que compartilhamos."
              },
              {
                icon: "✨",
                title: "Qualidade",
                description: "Tecidos premium, caimento confortável e acabamento de alto padrão. Cada peça é feita para durar muitas histórias e acompanhar sua jornada."
              },
              {
                icon: "🤝",
                title: "Comunidade",
                description: "Colaborações com artistas independentes e ações culturais. Benê é para todo mundo que acredita na força da expressão e da diversidade."
              },
            ].map((item) => (
              <div key={item.title} className="group">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-brand-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-gradient-to-br from-brand-primary/10 via-brand-forest/10 to-brand-accent/10">
        <Container className="max-w-4xl text-center">
          <H2 className="mb-6">De São Paulo para o Mundo</H2>
          <Text className="text-xl leading-relaxed mb-8">
            Levamos a energia das ruas brasileiras para cada canto. Nossa missão é vestir pessoas que
            não têm medo de se expressar, que celebram suas raízes e que constroem sua própria identidade
            através do estilo.
          </Text>
          <div className="flex flex-wrap justify-center gap-12 mt-12 font-bold">
            <div className="text-center flex items-center justify-center flex-col gap-2">
              <img src="https://twemoji.maxcdn.com/v/latest/svg/1f1e7-1f1f7.svg" className="w-8 h-8" />
              <div className="text-sm text-neutral-600 mt-1">100% Brasileiro</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-brand-primary">♻️</div>
              <div className="text-sm text-neutral-600 mt-1">Produção Consciente</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-brand-primary">🎨</div>
              <div className="text-sm text-neutral-600 mt-1">Arte Autoral</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-brand-primary">✨</div>
              <div className="text-sm text-neutral-600 mt-1">Edição Limitada</div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-primary via-brand-forest to-brand-accent">
        <Container className="max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold  mb-6">
            Junte-se ao Movimento
          </h2>
          <p className="text-xl mb-8">
            Assine nossa newsletter e receba em primeira mão lançamentos, promoções exclusivas e
            convites para eventos especiais.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              className="flex-1 rounded-lg px-6 py-4 text-lg outline-none focus:ring-4 focus:ring-white/30 transition"
              placeholder="Seu melhor e-mail"
            />
            <Button
              variant="outline"
              className="bg-white text-brand-primary hover:bg-white/90 border-white px-8 py-4 text-lg font-semibold whitespace-nowrap"
            >
              Assinar Agora
            </Button>
          </form>
        </Container>
      </section>
    </main>
  );
}
