<!-- src/views/Cupones.vue -->
<script setup>
import { ref } from 'vue'
import jsPDF from 'jspdf'

const cupones = ref([
    { id: 1, codigo: 'WELCOME20', descuento: 20, estado: 'Activo' },
    { id: 2, codigo: 'SUMMER25', descuento: 25, estado: 'Activo' }
])

const dialog = ref(false)
const dialogPDF = ref(false)
const pdfUrl = ref('')

const newCupon = ref({
    codigo: '',
    descuento: 0,
    estado: 'Activo'
})

const agregarCupon = () => {
    cupones.value.push({
        id: cupones.value.length + 1,
        ...newCupon.value
    })
    dialog.value = false
    newCupon.value = {
        codigo: '',
        descuento: 0,
        estado: 'Activo'
    }
}
const GenerarFormato = (doc, cupon) => {
    // Configurar fuente
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)

    // Título
    doc.text('CUPÓN DE DESCUENTO', 105, 30, { align: 'center' })

    // Configurar fuente para el contenido
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(16)

    // Agregar código del cupón
    doc.text(`Código: ${cupon.codigo}`, 105, 60, { align: 'center' })

    // Agregar descuento
    doc.text(`Descuento'Á: ${cupon.descuento}%`, 105, 80, { align: 'center' })

    // Agregar fecha de validez
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() + 1)
    doc.text(`Válido hasta: ${fecha.toLocaleDateString()}`, 105, 100, { align: 'center' })

    // Agregar marco decorativo
    doc.setDrawColor(0)
    doc.setLineWidth(1)
    doc.rect(20, 20, 170, 100)

    // Agregar línea decorativa bajo el título
    doc.line(40, 40, 160, 40)
}

const generarPDF = (cupon) => {
    var doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 150]
    })

    //ejecutar GenerarFormato
    GenerarFormato(doc, cupon)

    doc.addPage()
    GenerarFormato(doc, cupon)

    // Generar URL del PDF
    const pdfData = doc.output('datauristring')
    pdfUrl.value = pdfData
    dialogPDF.value = true
}

const descargarPDF = () => {
    const link = document.createElement('a')
    link.href = pdfUrl.value
    link.download = 'cupon.pdf'
    link.click()
}
</script>

<template>
    <v-container>
        <v-row>
            <v-col>
                <h1 class="text-h4 mb-4">Gestión de Cupones</h1>

                <v-btn color="primary" class="mb-4" @click="dialog = true">
                    Nuevo Cupón
                </v-btn>

                <v-table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descuento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cupon in cupones" :key="cupon.id">
                            <td>{{ cupon.codigo }}</td>
                            <td>{{ cupon.descuento }}%</td>
                            <td>{{ cupon.estado }}</td>
                            <td>
                                <v-btn icon="mdi-file-pdf-box" color="success" size="small" class="mr-2"
                                    @click="generarPDF(cupon)"></v-btn>
                                <v-btn icon="mdi-pencil" color="primary" size="small" class="mr-2"
                                    @click="() => { }"></v-btn>
                                <v-btn icon="mdi-delete" color="error" size="small" @click="() => { }"></v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>

                <!-- Modal para nuevo cupón -->
                <v-dialog v-model="dialog" max-width="500px">
                    <v-card>
                        <v-card-title>Nuevo Cupón</v-card-title>
                        <v-card-text>
                            <v-text-field v-model="newCupon.codigo" label="Código" required></v-text-field>
                            <v-text-field v-model="newCupon.descuento" label="Descuento (%)" type="number"
                                required></v-text-field>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="primary" @click="agregarCupon">
                                Guardar
                            </v-btn>
                            <v-btn color="error" @click="dialog = false">
                                Cancelar
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Modal para visualizar PDF -->
                <v-dialog v-model="dialogPDF" max-width="800">
                    <v-card>
                        <v-card-title>
                            Vista Previa del Cupón
                            <v-spacer></v-spacer>
                            <v-btn icon="mdi-download" color="primary" @click="descargarPDF"></v-btn>
                            <v-btn icon="mdi-close" @click="dialogPDF = false"></v-btn>
                        </v-card-title>
                        <v-card-text>
                            <div class="pdf-container" style="height: 600px;">
                                <iframe :src="pdfUrl" width="100%" height="100%" style="border: none;"></iframe>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
.pdf-container {
    width: 100%;
    overflow: hidden;
    border: 1px solid #ddd;
    border-radius: 4px;
}
</style>