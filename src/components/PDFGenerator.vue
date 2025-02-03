//PDFGenerator.vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PDFService from '../services/PDFService' // Corregido el path
import ContribuyenteService from '../services/ContribuyenteService'
import axios from 'axios'

const pdfService = new PDFService();
const isInitialized = ref(false);

const loading = ref(false)
const pdfUrl = ref('')
const dialog = ref(false)
const pdfIframe = ref(null)
const progressValue = ref(0)

const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
})

const selectedFormats = ref(['HR'])
const startRange = ref(1)
const endRange = ref(1)
const saveToFile = ref(false)

const formatOptions = [
    // { text: 'INICIO', value: 'INICIO' },
    // { text: 'HAD', value: 'HAD' },
    { text: 'HR', value: 'HR' },
    { text: 'PU', value: 'PU' },
    { text: 'HLP', value: 'HLP' },
    { text: 'HLA', value: 'HLA' },
    // { text: 'FIN', value: 'FIN' }
]

const formattedRangeLabel = computed(() => {
    if (startRange.value === endRange.value) {
        return `Generando cuponera para código: ${startRange.value}`
    }
    return `Generando cuponeras desde ${startRange.value} hasta ${endRange.value}`
})


const generatePDF = async () => {
    if (!isInitialized.value) {
        await pdfService.initialize('MDDA', '2025');
        isInitialized.value = true;
    }

    if (selectedFormats.value.length === 0) {
        showSnackbar('Por favor seleccione al menos un formato', 'error')
        return
    }

    loading.value = true
    const pdfContainer = document.getElementById('pdfContainer')
    pdfContainer.innerHTML = ''

    try {
        // // Obtener todos los contribuyentes necesarios de una vez
        // const contribuyentes = await ContribuyenteService.fetchMultipleContribuyentes(
        //     startRange.value,
        //     endRange.value
        // )

        // // Procesar cada contribuyente
        // let ii = startRange.value
        // for (const contribuyente of contribuyentes) {
        //     if (!contribuyente) continue;

        //     // Crear instancia del servicio PDF
        //     // const pdfService = new PDFService()

        //     // Generar el PDF completo
        //     const dataUri = await pdfService.generateComplete(
        //         selectedFormats.value,
        //         contribuyente,
        //         'MDDA',
        //         '2025'
        //     )

        //     // // Obtener el PDF como data URI
        //     // const dataUri = await pdfService.save(saveToFile.value)
        //     createPDFIcon(contribuyente.CODIGO, dataUri)
        //     // Crear icono para este PDF
        //     // createPDFIcon(i, dataUri); 

        //     // Actualizar progreso
        //     const progress = ((ii - startRange.value + 1) / (endRange.value - startRange.value + 1)) * 100;
        //     // progressValue.value = progress;
        //     ii++;
        // }
        for (let i = startRange.value; i <= endRange.value; i++) {
            // Obtener datos del contribuyente
            // const datosContribuyente = await fetchContribuyenteData(i);
            const datosContribuyente = await ContribuyenteService.fetchMultipleContribuyentes(
                i,
                i
            );

            // console.log('datosContribuyente', datosContribuyente)
            const contribuyente = datosContribuyente[0];
            if (!contribuyente) continue;
            // Generar el PDF
            const dataUri = await pdfService.generateComplete(
                selectedFormats.value,
                contribuyente,
                'MDDA',
                '2025'
            );

            // Crear icono para este PDF
            // createPDFIcon(i, dataUri);
            console.log('Contribuyente', contribuyente)
            createPDFIcon(contribuyente['CODIGO'], dataUri)
            // Actualizar progreso
            const progress = ((i - startRange.value + 1) / (endRange.value - startRange.value + 1)) * 100;
            progressValue.value = progress;
        }


        showSnackbar('PDFs generados correctamente', 'success')
    } catch (error) {
        console.error('Error generando PDFs:', error)
        showSnackbar('Error al generar PDFs: ' + error.message, 'error')
    } finally {
        loading.value = false
    }
}
const createPDFIcon = (codigo, url) => {
    const pdfContainer = document.getElementById('pdfContainer');

    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'inline-block';
    iconContainer.style.margin = '10px';

    const icon = document.createElement('i');
    icon.className = 'mdi mdi-file-pdf v-icon';
    icon.style.cursor = 'pointer';
    icon.style.fontSize = '24px';
    icon.style.color = '#1867C0';

    // Almacenar la URL en el dataset para poder limpiarla después
    icon.dataset.url = url;

    icon.addEventListener('click', () => {
        pdfUrl.value = url;
        dialog.value = true;
    });

    const label = document.createElement('span');
    label.textContent = ` ${codigo}`;
    label.style.marginLeft = '5px';

    iconContainer.appendChild(icon);
    iconContainer.appendChild(label);
    pdfContainer.appendChild(iconContainer);
};



const showSnackbar = (text, color = 'success') => {
    snackbar.value = {
        show: true,
        text,
        color
    }
}

const downloadCurrentPDF = () => {
    const link = document.createElement('a')
    link.href = pdfUrl.value
    link.download = `cuponera-${startRange.value}.pdf`
    link.click()
}

// Inicializar servicio al montar el componente
// onMounted(async () => {
//     try {
//         loading.value = true;
//         await pdfService.initialize('MDDA', '2025');
//         isInitialized.value = true;
//     } catch (error) {
//         console.error('Error initializing PDFService:', error);
//         showSnackbar('Error al inicializar el servicio', 'error');
//     } finally {
//         loading.value = false;
//     }
// });

// Limpiar URLs al desmontar
onUnmounted(() => {
    const pdfContainer = document.getElementById('pdfContainer')
    if (pdfContainer) {
        const icons = pdfContainer.getElementsByTagName('i')
        for (const icon of icons) {
            if (icon.dataset.url) {
                URL.revokeObjectURL(icon.dataset.url)
            }
        }
    }
    if (pdfUrl.value) {
        URL.revokeObjectURL(pdfUrl.value)
    }
})
</script>

<template>
    <v-container>
        <v-row>
            <v-col>
                <h1 class="text-h4 mb-4">Generador de Cuponera</h1>

                <v-card class="mb-4">
                    <v-card-text>
                        <v-row>
                            <v-col cols="12">
                                <p class="text-subtitle-1 mb-2">Formatos:</p>
                                <v-checkbox v-for="option in formatOptions" :key="option.value"
                                    v-model="selectedFormats" :label="option.text" :value="option.value" hide-details
                                    class="mt-0" density="compact"></v-checkbox>
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field v-model="startRange" label="Inicio" type="number" min="1"
                                    density="compact"></v-text-field>
                            </v-col>

                            <v-col cols="12" sm="6">
                                <v-text-field v-model="endRange" label="Fin" type="number" min="1"
                                    density="compact"></v-text-field>
                            </v-col>

                            <v-col cols="12">
                                <v-checkbox v-model="saveToFile" label="Guardar en carpeta" hide-details
                                    density="compact"></v-checkbox>
                            </v-col>
                        </v-row>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" :loading="loading" :disabled="selectedFormats.length === 0"
                            @click="generatePDF">
                            Generar PDF{{ startRange === endRange ? '' : 's' }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <div id="pdfContainer" class="mt-4"></div>

                <!-- Progress bar -->
                <v-progress-linear v-if="loading" v-model="progressValue" color="primary" height="20">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>

                <!-- Dialog para previsualizar PDF -->
                <v-dialog v-model="dialog" max-width="90%">
                    <v-card>
                        <v-toolbar density="compact" color="primary">
                            <v-toolbar-title class="text-white">
                                {{ formattedRangeLabel }}
                            </v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-btn icon variant="text" @click="downloadCurrentPDF" color="white">
                                <v-icon>mdi-download</v-icon>
                            </v-btn>
                            <v-btn icon variant="text" @click="dialog = false" color="white">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar>

                        <v-card-text class="pa-0">
                            <iframe ref="pdfIframe" :src="pdfUrl"
                                style="width: 100%; height: 80vh; border: none;"></iframe>
                        </v-card-text>
                    </v-card>
                </v-dialog>

                <!-- Snackbar para notificaciones -->
                <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
                    {{ snackbar.text }}
                </v-snackbar>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
#pdfContainer {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px;
}

.v-icon {
    transition: transform 0.2s;
}

.v-icon:hover {
    transform: scale(1.1);
}
</style>