<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Sticky Header -->
    <q-header class="landing-header">
      <q-toolbar class="landing-toolbar">
        <div class="brand" @click="scrollToTop">
          <div class="brand-icon">
            <img src="/icons/White.png" alt="San3a logo" class="brand-logo-mark" />
          </div>
          <span class="brand-name">San3a</span>
        </div>
        <q-space />
        <div class="header-actions">
          <q-btn flat no-caps class="signin-link" label="Sign In" @click="goTo('/signin')" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Get Started"
            class="get-started-btn"
            @click="goTo('/signup')"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <!-- HERO SECTION -->
        <section class="hero-section">
          <div class="hero-pattern"></div>
          <div class="hero-inner">
            <h1 class="hero-title san3a-animate-in">
              Your Trusted Home Services
              <br />
              <span class="hero-highlight">Marketplace in Egypt</span>
            </h1>
            <p class="hero-subtitle san3a-animate-in san3a-stagger-1">
              Connect with verified, skilled technicians for all your home repair and maintenance
              needs. Fast, reliable, and affordable.
            </p>
            <div class="hero-cta san3a-animate-in san3a-stagger-2">
              <q-btn
                unelevated
                no-caps
                size="lg"
                class="cta-primary"
                label="Get Started as Customer"
                @click="goTo('/signup')"
              />
              <q-btn
                outline
                no-caps
                size="lg"
                class="cta-outline"
                label="Join as Technician"
                @click="goTo('/signup')"
              />
            </div>
          </div>
        </section>

        <!-- STATS SECTION -->
        <section class="stats-section">
          <div class="stats-grid">
            <div
              v-for="(stat, i) in stats"
              :key="i"
              class="stat-item san3a-animate-in"
              :class="`san3a-stagger-${i + 1}`"
            >
              <div class="stat-number">{{ stat.number }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </section>

        <!-- SERVICES SECTION -->
        <section class="services-section">
          <div class="section-inner">
            <h2 class="section-title">Browse Our Services</h2>
            <p class="section-subtitle">
              From plumbing to painting, find the right expert for every home service need
            </p>
            <div class="services-grid">
              <div
                v-for="(service, i) in services"
                :key="i"
                class="service-card san3a-animate-in"
                :class="`san3a-stagger-${i + 1}`"
                @click="goTo('/signup')"
              >
                <div class="service-icon-wrap">
                  <q-icon :name="service.icon" size="32px" color="primary" />
                </div>
                <h3 class="service-name">{{ service.title }}</h3>
                <p class="service-desc">{{ service.description }}</p>
                <div class="service-count">{{ service.count }} active requests</div>
              </div>
            </div>
          </div>
        </section>

        <!-- HOW IT WORKS SECTION -->
        <section class="how-section">
          <div class="section-inner">
            <h2 class="section-title">How San3a Works</h2>
            <p class="section-subtitle">Get your home services done in three simple steps</p>
            <div class="steps-grid">
              <div
                v-for="(step, i) in steps"
                :key="i"
                class="step-item san3a-animate-in"
                :class="`san3a-stagger-${i + 1}`"
              >
                <div class="step-number">{{ step.number }}</div>
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-desc">{{ step.description }}</p>
              </div>
            </div>
            <div class="steps-line"></div>
          </div>
        </section>

        <!-- TRUST SECTION -->
        <section class="trust-section">
          <div class="section-inner">
            <div class="trust-grid">
              <div
                v-for="(item, i) in trustItems"
                :key="i"
                class="trust-item san3a-animate-in"
                :class="`san3a-stagger-${i + 1}`"
              >
                <div class="trust-icon-wrap">
                  <q-icon :name="item.icon" size="32px" color="primary" />
                </div>
                <h3 class="trust-title">{{ item.title }}</h3>
                <p class="trust-desc">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA SECTION -->
        <section class="cta-section">
          <div class="section-inner" style="text-align: center">
            <h2 class="cta-heading">Ready to Get Started?</h2>
            <p class="cta-sub">
              Join thousands of satisfied customers who trust San3a for their home services
            </p>
            <div class="cta-buttons">
              <q-btn
                unelevated
                no-caps
                size="lg"
                class="cta-white"
                label="Sign Up Now"
                @click="goTo('/signup')"
              />
              <q-btn
                outline
                no-caps
                size="lg"
                class="cta-outline-white"
                label="Sign In"
                @click="goTo('/signin')"
              />
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="site-footer">
          <div class="footer-inner">
            <div class="footer-grid">
              <div class="footer-brand">
                <div class="brand" style="margin-bottom: 16px">
                  <div class="brand-icon">
                    <img src="/icons/White.png" alt="San3a logo" class="brand-logo-mark" />
                  </div>
                  <span class="brand-name" style="color: #fff">San3a</span>
                </div>
                <p class="footer-desc">
                  Egypt's trusted home services marketplace connecting customers with skilled
                  technicians.
                </p>
              </div>
              <div class="footer-col">
                <h4 class="footer-heading">Services</h4>
                <ul class="footer-links">
                  <li>Plumbing</li>
                  <li>Electrical</li>
                  <li>Carpentry</li>
                  <li>Painting</li>
                </ul>
              </div>
              <div class="footer-col">
                <h4 class="footer-heading">Company</h4>
                <ul class="footer-links">
                  <li>About Us</li>
                  <li>How It Works</li>
                  <li>Become a Technician</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div class="footer-col">
                <h4 class="footer-heading">Legal</h4>
                <ul class="footer-links">
                  <li>Terms of Service</li>
                  <li>Privacy Policy</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; 2026 San3a. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const goTo = (path) => router.push(path)
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const stats = ref([
  { number: '--', label: 'Customers' },
  { number: '--', label: 'Technicians' },
  { number: '--', label: 'Requests Posted' },
  { number: '--', label: 'Completion Rate' },
])

const serviceCatalog = [
  {
    key: 'plumber',
    icon: 'plumbing',
    title: 'Plumbing',
    description: 'Expert plumbing services for all your needs',
  },
  {
    key: 'electrician',
    icon: 'electrical_services',
    title: 'Electrical',
    description: 'Safe and certified electrical work',
  },
  {
    key: 'carpenter',
    icon: 'handyman',
    title: 'Carpentry',
    description: 'Custom woodwork and furniture repair',
  },
  {
    key: 'painter',
    icon: 'format_paint',
    title: 'Painting',
    description: 'Professional painting and finishing',
  },
  {
    key: 'kitchen_fitter',
    icon: 'kitchen',
    title: 'Kitchen Services',
    description: 'Kitchen installation and repairs',
  },
  {
    key: 'drapery_seamstress',
    icon: 'checkroom',
    title: 'Drapery',
    description: 'Curtains, blinds, and window treatments',
  },
]

const services = ref(serviceCatalog.map((service) => ({ ...service, count: 0 })))

const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const countRows = async (tableName, idColumn, applyFilter) => {
  let query = supabase.from(tableName).select(idColumn, { count: 'exact', head: true })
  if (applyFilter) query = applyFilter(query)

  const { count, error } = await query
  if (error) return null
  return count ?? 0
}

const loadLandingMetrics = async () => {
  const { data: landingMetrics, error: rpcError } = await supabase
    .rpc('get_landing_metrics')
    .maybeSingle()

  if (!rpcError && landingMetrics) {
    const customers = Number(landingMetrics.customers_count || 0)
    const technicians = Number(landingMetrics.technicians_count || 0)
    const totalRequests = Number(landingMetrics.total_requests || 0)
    const completedRequests = Number(landingMetrics.completed_requests || 0)
    const serviceCounts = landingMetrics.active_service_counts || {}

    const completionRate =
      totalRequests > 0 ? `${Math.round((completedRequests / totalRequests) * 100)}%` : '--'

    stats.value = [
      { number: formatCompact(customers), label: 'Customers' },
      { number: formatCompact(technicians), label: 'Technicians' },
      { number: formatCompact(totalRequests), label: 'Requests Posted' },
      { number: completionRate, label: 'Completion Rate' },
    ]

    services.value = serviceCatalog.map((service) => ({
      ...service,
      count: Number(serviceCounts[service.key] || 0),
    }))
    return
  }

  const [customers, technicians, totalRequests, completedRequests, serviceRowsRes] =
    await Promise.all([
      countRows('users', 'user_id'),
      countRows('technician', 'technician_id'),
      countRows('request', 'request_id'),
      countRows('request', 'request_id', (query) => query.eq('request_status', 'completed')),
      supabase
        .from('request')
        .select('service_type, request_status')
        .order('request_id', { ascending: false })
        .limit(1000),
    ])

  const completionRate =
    typeof completedRequests === 'number' && typeof totalRequests === 'number' && totalRequests > 0
      ? `${Math.round((completedRequests / totalRequests) * 100)}%`
      : '--'

  stats.value = [
    { number: typeof customers === 'number' ? formatCompact(customers) : '--', label: 'Customers' },
    {
      number: typeof technicians === 'number' ? formatCompact(technicians) : '--',
      label: 'Technicians',
    },
    {
      number: typeof totalRequests === 'number' ? formatCompact(totalRequests) : '--',
      label: 'Requests Posted',
    },
    { number: completionRate, label: 'Completion Rate' },
  ]

  const activeByService = Object.fromEntries(serviceCatalog.map((service) => [service.key, 0]))
  const rows = serviceRowsRes?.data || []

  rows.forEach((request) => {
    const status = request.request_status?.toLowerCase()
    const isActive = status !== 'completed' && status !== 'cancelled'
    if (isActive && activeByService[request.service_type] !== undefined) {
      activeByService[request.service_type] += 1
    }
  })

  services.value = serviceCatalog.map((service) => ({
    ...service,
    count: activeByService[service.key] || 0,
  }))
}

onMounted(() => {
  loadLandingMetrics()
})

const steps = [
  {
    number: 1,
    title: 'Describe Your Need',
    description: 'Tell us what you need in a few simple steps',
  },
  {
    number: 2,
    title: 'Compare Offers',
    description: 'Receive and compare offers from qualified technicians',
  },
  {
    number: 3,
    title: 'Get It Done',
    description: 'Choose the best offer and get your service completed',
  },
]

const trustItems = [
  {
    icon: 'verified_user',
    title: 'Verified Professionals',
    description: 'All technicians are vetted and verified with background checks',
  },
  {
    icon: 'star',
    title: 'Quality Guaranteed',
    description: 'Read reviews and ratings from real customers before you book',
  },
  {
    icon: 'schedule',
    title: 'Fast Response',
    description: 'Get offers from technicians within hours, not days',
  },
]
</script>

<style scoped>
/* ───── Header ───── */
.landing-header {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
}

.landing-toolbar {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signin-link {
  color: var(--san3a-gray-700) !important;
  font-weight: 600;
}

.get-started-btn {
  padding: 6px 20px !important;
}

/* ───── Hero ───── */
.hero-section {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--san3a-primary),
    var(--san3a-primary-hover),
    var(--san3a-primary)
  );
  padding: 100px 24px 80px;
  text-align: center;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(32px, 5.5vw, 56px);
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  margin: 0 0 20px;
}

.hero-highlight {
  color: var(--san3a-secondary);
}

.hero-subtitle {
  font-size: clamp(16px, 2.2vw, 20px);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  max-width: 640px;
  margin: 0 auto 32px;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.cta-primary {
  background: #fff !important;
  color: var(--san3a-primary) !important;
  font-weight: 700;
  padding: 10px 28px !important;
}

.cta-outline {
  border-color: rgba(255, 255, 255, 0.7) !important;
  color: #fff !important;
  font-weight: 700;
  padding: 10px 28px !important;
}

.cta-outline:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* ───── Stats ───── */
.stats-section {
  background: #fff;
  border-bottom: 1px solid var(--san3a-gray-200);
  padding: 48px 24px;
}

.stats-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
}

.stat-number {
  font-size: clamp(28px, 3.5vw, 40px);
  font-weight: 800;
  color: var(--san3a-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--san3a-gray-600);
  font-weight: 500;
}

/* ───── Services ───── */
.services-section {
  padding: 80px 24px;
  background: var(--san3a-bg);
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.section-title {
  font-size: clamp(28px, 3.5vw, 40px);
  font-weight: 800;
  color: var(--san3a-gray-900);
  text-align: center;
  margin: 0 0 12px;
}

.section-subtitle {
  font-size: 17px;
  color: var(--san3a-gray-600);
  text-align: center;
  margin: 0 auto 48px;
  max-width: 560px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.service-card {
  background: #fff;
  border-radius: var(--san3a-radius-xl);
  border: 1px solid var(--san3a-gray-200);
  padding: 28px 24px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--san3a-shadow-lg);
}

.service-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--san3a-radius-lg);
  background: var(--san3a-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.service-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--san3a-gray-900);
  margin: 0 0 8px;
}

.service-desc {
  font-size: 14px;
  color: var(--san3a-gray-600);
  line-height: 1.5;
  margin: 0 0 12px;
}

.service-count {
  font-size: 13px;
  color: var(--san3a-primary);
  font-weight: 600;
}

/* ───── How It Works ───── */
.how-section {
  padding: 80px 24px;
  background: #fff;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  text-align: center;
  position: relative;
}

.steps-line {
  display: none;
}

.step-number {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--san3a-gray-900);
  margin: 0 0 10px;
}

.step-desc {
  font-size: 15px;
  color: var(--san3a-gray-600);
  line-height: 1.5;
  margin: 0;
}

/* ───── Trust ───── */
.trust-section {
  padding: 80px 24px;
  background: var(--san3a-primary-light);
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  text-align: center;
}

.trust-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: var(--san3a-shadow-sm);
}

.trust-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--san3a-gray-900);
  margin: 0 0 10px;
}

.trust-desc {
  font-size: 15px;
  color: var(--san3a-gray-700);
  line-height: 1.5;
  margin: 0;
}

/* ───── CTA ───── */
.cta-section {
  padding: 80px 24px;
  background: linear-gradient(
    135deg,
    var(--san3a-primary),
    var(--san3a-primary-hover),
    var(--san3a-primary)
  );
}

.cta-heading {
  font-size: clamp(28px, 3.5vw, 40px);
  font-weight: 800;
  color: #fff;
  margin: 0 0 12px;
}

.cta-sub {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 auto 32px;
  max-width: 560px;
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.cta-white {
  background: #fff !important;
  color: var(--san3a-primary) !important;
  font-weight: 700;
  padding: 10px 28px !important;
}

.cta-outline-white {
  border-color: rgba(255, 255, 255, 0.6) !important;
  color: #fff !important;
  font-weight: 700;
  padding: 10px 28px !important;
}

/* ───── Footer ───── */
.site-footer {
  background: var(--san3a-gray-900);
  color: #fff;
  padding: 64px 24px 0;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 48px;
}

.footer-desc {
  font-size: 14px;
  color: var(--san3a-gray-400);
  line-height: 1.6;
  margin: 0;
}

.footer-heading {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 16px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links li {
  font-size: 14px;
  color: var(--san3a-gray-400);
  cursor: pointer;
  transition: color 0.2s;
}

.footer-links li:hover {
  color: #fff;
}

.footer-bottom {
  border-top: 1px solid var(--san3a-gray-800);
  padding: 24px 0;
  text-align: center;
}

.footer-bottom p {
  font-size: 14px;
  color: var(--san3a-gray-400);
  margin: 0;
}

/* ───── Responsive ───── */
@media (max-width: 900px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 80px 20px 60px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .services-grid,
  .steps-grid,
  .trust-grid {
    grid-template-columns: 1fr;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hero-cta {
    flex-direction: column;
    align-items: center;
  }

  .cta-primary,
  .cta-outline {
    width: 100%;
  }
}
</style>
