<!-- src/App.vue -->
<script setup>
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>
        Generador de Cupones
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn to="/" variant="text">Inicio</v-btn>
      <!-- <v-btn to="/cupones" variant="text">Cupones</v-btn> -->
      <v-btn to="/pdfgenerator" variant="text">Genera Cupones</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>


  </v-app>
</template>