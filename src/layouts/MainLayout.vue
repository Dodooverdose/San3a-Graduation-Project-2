<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center">
        <div class="welcome-container q-pa-lg">
          <div class="logo-wrapper">
            <img src="/icons/0.png" alt="San3a" class="animated-logo" />
          </div>

          <div class="loading-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>

          <div class="text-h4 text-center q-my-lg text-weight-bold">Sanعa</div>

          <p class="text-center text-subtitle1 q-mb-xl text-grey-7">
            Welcome To Our Service Platform
          </p>

          <div class="buttons-container q-gutter-md">
            <q-btn
              unelevated
              color="primary"
              label="Sign Up"
              size="lg"
              class="full-width"
              @click="goToSignUp"
            />

            <q-btn
              outline
              color="primary"
              label="Sign In"
              size="lg"
              class="full-width"
              @click="goToSignIn"
            />
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToSignUp = () => {
  router.push('/signup')
}

const goToSignIn = () => {
  router.push('/signin')
}
</script>

<style scoped>
.welcome-container {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.animated-logo {
  width: 120px;
  height: 120px;
  animation: bounce 2s infinite;
  object-fit: contain;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.buttons-container {
  margin-top: 40px;
  margin-left: -15px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
  height: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  background-color: #1976d2;
  border-radius: 50%;
  animation: pulse 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
