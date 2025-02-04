<!-- src/views/Home.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('Generador de Cupones')

const navigateToCupones = () => {
    router.push('/PDFGenerator')
}
</script>

<template>
    <v-container>
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6">
                <v-card class="mt-5">
                    <v-card-title class="text-center text-h4 py-4">
                        {{ title }}
                    </v-card-title>

                    <v-card-text>
                        <p class="text-body-1 mb-4">
                            Bienvenido al sistema de generación de cupones.
                            Aquí podrás crear y administrar cupones de descuento.
                        </p>
                    </v-card-text>

                    <v-card-actions class="justify-center pb-6">
                        <v-btn color="primary" size="large" @click="navigateToCupones">
                            Comenzar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>