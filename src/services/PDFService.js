// services/PDFService.js
import { jsPDF } from "jspdf";

class PDFService {
  pdf = null;

  constructor() {
    this.initializePDF();
    this.resourceCache = new Map();
    // this.pathChecksCache = new Map();
    this.formatosPreload = ["CLAVE", "HAD", "HR", "PU", "HLP", "HLA"];
  }

  // Método para inicializar/reiniciar el PDF
  async initializePDF() {
    this.pdf = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: [210, 148],
    });

    // Configuración inicial
    this.pdf.setFont("helvetica");
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setLineWidth(0.1);
    this.pdf.text("Prueba de generación", 10, 20);
  }
  // Método para limpiar el PDF actual
  resetPDF() {
    this.initializePDF();
  }
  // Inicializar y precargar recursos comunes
  async initialize(entidad, periodo) {
    const preloadPromises = this.formatosPreload.map((formato) =>
      this.preloadResources(formato, entidad, periodo)
    );
    await Promise.all(preloadPromises);
  }

  // Precargar recursos
  async preloadResources(formato, entidad, periodo) {
    const basePath = `formato/${entidad}/${periodo}`;
    const paths = [
      `${basePath}/formatos/${formato}.pdf`,
      `${basePath}/imagenes/${formato}.png`,
    ];

    for (const path of paths) {
      await this.loadAndCacheResource(path);
    }
  }

  // Cargar y cachear recurso
  async loadAndCacheResource(path) {
    if (this.resourceCache.has(path)) {
      return this.resourceCache.get(path);
    }

    try {
      const response = await fetch(path);
      if (!response.ok) return null;

      const blob = await response.blob();
      this.resourceCache.set(path, blob);
      return blob;
    } catch {
      return null;
    }
  }

  // Verificar existencia de archivo (con caché)
  async checkFileExists(url) {
    if (this.pathChecksCache.has(url)) {
      return this.pathChecksCache.get(url);
    }

    try {
      const response = await fetch(url, { method: "HEAD" });
      const exists = response.ok;
      this.pathChecksCache.set(url, exists);
      return exists;
    } catch {
      this.pathChecksCache.set(url, false);
      return false;
    }
  }

  // Función optimizada para cargar formato
  async loadFormat(formato, entidad, periodo) {
    const basePath = `formato/${entidad}/${periodo}`;
    const paths = [
      `${basePath}/formatos/${formato}.pdf`,
      `${basePath}/imagenes/${formato}.png`,
    ];

    // Buscar en caché primero
    for (const path of paths) {
      const cachedResource = this.resourceCache.get(path);
      if (cachedResource) {
        const extension = path.split(".").pop().toLowerCase();
        if (extension === "pdf") {
          await this.processPDFBlob(cachedResource);
          return true;
        } else {
          await this.processImageBlob(cachedResource);
          return true;
        }
      }
    }

    // Si no está en caché, cargar y cachear
    for (const path of paths) {
      const resource = await this.loadAndCacheResource(path);
      if (resource) {
        const extension = path.split(".").pop().toLowerCase();
        if (extension === "pdf") {
          await this.processPDFBlob(resource);
          return true;
        } else {
          await this.processImageBlob(resource);
          return true;
        }
      }
    }

    // Si no se encuentra ningún formato, agregar marca de agua
    this.addWatermark(formato);
    return false;
  }

  // Procesar blob de PDF
  async processPDFBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    return this.pdf.addPage().addFileToVFS("temp.pdf", arrayBuffer);
  }

  // Procesar blob de imagen
  async processImageBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          this.pdf.addImage(reader.result, "PNG", 0, 0, 210, 148);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Función para agregar PDF desde ruta
  async addPDFFromPath(pdfPath) {
    try {
      const response = await fetch(pdfPath);
      const pdfData = await response.arrayBuffer();
      return this.pdf.addPage().addFileToVFS(pdfPath, pdfData);
    } catch (error) {
      console.error("Error loading PDF:", error);
      this.addWatermark(pdfPath.split("/").pop().split(".")[0]);
    }
  }

  // Función para agregar imagen desde ruta
  async addImageFromPath(imagePath, x = 0, y = 0, width = 210, height = 148) {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const base64data = reader.result;
            this.pdf.addImage(base64data, "PNG", x, y, width, height);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading image:", error);
      this.addWatermark(imagePath.split("/").pop().split(".")[0]);
      return false;
    }
  }

  // Función para agregar marca de agua
  addWatermark(formatName) {
    // Guardar el estado actual
    const currentFontSize = this.pdf.getFontSize();
    const currentTextColor = this.pdf.getTextColor();

    // Configurar estilo de la marca de agua
    this.pdf.setFontSize(40);
    this.pdf.setTextColor(200, 200, 200); // Gris claro

    // Calcular posición central
    const pageWidth = this.pdf.internal.pageSize.width;
    const pageHeight = this.pdf.internal.pageSize.height;
    const text = `${formatName} - SIN FORMATO`;
    const textWidth =
      (this.pdf.getStringUnitWidth(text) * 40) / this.pdf.internal.scaleFactor;
    const x = (pageWidth - textWidth) / 2;
    const y = pageHeight / 2;

    // Rotar y dibujar texto
    this.pdf.saveGraphicsState();
    this.pdf.rotate(-45, x, y);
    this.pdf.text(text, x, y);
    this.pdf.restoreGraphicsState();

    // Restaurar estado original
    this.pdf.setFontSize(currentFontSize);
    this.pdf.setTextColor(currentTextColor);
  }

  // Métodos auxiliares
  padLeft(text, length, char) {
    return String(text).padStart(length, char);
  }

  formatNumber(number) {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }

  handleError(error) {
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(255, 0, 0);
    this.pdf.text(`Error: ${error.message}`, 10, 10);
    this.pdf.setTextColor(0);
  }

  addPredioToHR(predio, y) {
    const x = 6;

    this.pdf.text(this.padLeft(predio.pred, 3, "0"), x, y);
    this.pdf.text(predio.codpredio, x + 9, y);

    const direccion =
      `${predio.sectorpredio} ${predio.tipogrupohab} ${predio.grupourbano} ${predio.tipovia} ${predio.nombrevia} ${predio.direccion}`.trim();
    this.pdf.text(direccion, x + 24, y);

    this.pdf.text(this.formatNumber(predio.nvalpre), x + 142, y);
    this.pdf.text(predio.nporcen, x + 162, y);
    this.pdf.text(this.formatNumber(predio.afecto), x + 172, y);
  }

  // Método principal para generar todos los formatos
  async generateComplete(formatos, datos, entidad, periodo) {
    // Reiniciar el PDF antes de comenzar
    this.resetPDF();

    console.log("Generando formatos:", formatos);
    console.log("Generando Pach:", this.resourceCache);
    try {
      for (const formato of formatos) {
        switch (formato) {
          case "HAD":
            await this.generateHAD(datos, entidad, periodo);
            break;
          case "HR":
            console.log("Generando HR...");
            await this.generateHR(datos, entidad, periodo);
            break;
          case "PU":
            for (const codigoPredio of Object.keys(datos.hr_predios)) {
              if (this.pdf.getNumberOfPages() > 1) this.pdf.addPage();
              await this.generatePU(datos, entidad, periodo, codigoPredio);
            }
            break;
          case "HLP":
            if (this.pdf.getNumberOfPages() > 1) this.pdf.addPage();
            await this.generateHLP(datos, entidad, periodo);
            break;
          case "HLA":
            for (const codigoPredio of Object.keys(datos.hr_predios)) {
              if (this.pdf.getNumberOfPages() > 1) this.pdf.addPage();
              await this.generateHLA(datos, entidad, periodo, codigoPredio);
            }
            break;
        }

        if (formato !== formatos[formatos.length - 1]) {
          console.log("Añadiendo página...");
          this.pdf.addPage();
        }
      }

      // Guardar el PDF actual
      const result = await this.save();
      console.log("PDF generado:");

      // Limpiar el PDF después de guardarlo
      // this.resetPDF();

      return result;
    } catch (error) {
      console.error("Error generating PDF:", error);
      this.resetPDF();
      throw error;
    }
  }

  // Método para guardar o retornar el PDF
  async save(saveToFile = false, filepath = "") {
    try {
      if (saveToFile && filepath) {
        return this.pdf.save(filepath);
      }
      return this.pdf.output("datauristring");
    } finally {
      // Asegurarse de que el PDF se reinicie incluso si hay un error
      this.resetPDF();
    }
  }

  // Método para generar formato HR con validación
  async generateHR(datos, entidad, periodo) {
    try {
      console.log("Datos HR:", datos);
      // await this.loadFormat("HR", entidad, periodo);
      this.pdf.setDrawColor(0);
      this.pdf.rect(5, 5, 200, 138);
      this.pdf.setFontSize(12);
      this.pdf.text("Prueba de generación", 120, 20);
      this.pdf.setTextColor(0);
      this.pdf.text("Prueba de generación", 50, 20);
      // ... resto del código de generación de HR ...
      // this.pdf.text("datos.RAZON_SOCIAL", 50, 101);
      this.pdf.text(` - SIN FORMATO`, 50, 74, {
        align: "center",
        angle: 45,
      });
      // this.pdf.text(this.padLeft(datos.CODIGO, 10, "0"), 179, 31);

      console.log("Datos HR impresos");
    } catch (error) {
      console.error("Error in HR:", error);
      this.handleError(error);
    }
  }
  // Método para generar formato PU
  async generatePU(datos, entidad, periodo, codigoPredio) {
    try {
      await this.loadFormat("PU", entidad, periodo);
      // const imagePath = `formato/${entidad}/${periodo}/imagenes/PU.png`;
      // await this.addImageFromPath(imagePath);

      const predio = datos.hr_predios[codigoPredio];
      if (!predio) throw new Error("Predio no encontrado");

      this.pdf.setFontSize(7);

      // Datos de cabecera
      this.pdf.text(datos.RAZON_SOCIAL, 8, 31);
      this.pdf.text(this.padLeft(datos.CODIGO, 10, "0"), 179, 31);

      // Dirección del predio
      const direccion =
        `${predio.sectorpredio} ${predio.tipogrupohab} ${predio.grupourbano} ${predio.tipovia} ${predio.nombrevia} ${predio.direccion}`.trim();
      this.pdf.text(direccion, 8, 44);

      // Código del predio
      this.pdf.text(predio.codpredio, 179, 44);

      // Datos adicionales
      this.pdf.text(predio.pu_predio.tipopredio, 8, 55);
      this.pdf.text(predio.pu_predio.usogen, 78, 55);
      this.pdf.text(predio.pu_predio.estadocons, 127, 55);
      this.pdf.text(predio.nporcen, 179, 55);

      // Valores
      this.pdf.text(this.formatNumber(predio.pu_predio2.nterren), 8, 130.5);
      this.pdf.text(this.formatNumber(predio.pu_predio2.narecom), 49, 130.5);
      this.pdf.text(this.formatNumber(predio.pu_predio2.narance), 93, 130.5);
    } catch (error) {
      console.error("Error in PU:", error);
      this.handleError(error);
    }
  }
  // Método para generar formato HAD
  async generateHAD(datos, entidad, periodo) {
    try {
      // const imagePath = `formato/${entidad}/${periodo}/imagenes/CLAVE.png`;
      // await this.addImageFromPath(imagePath);
      await this.loadFormat("HAD", entidad, periodo);

      this.pdf.setFontSize(8.5);

      // Posición inicial
      const yInicial = 9;
      const marginIzquierda = 55;

      // Código con padding
      this.pdf.text(
        this.padLeft(datos.CODIGO, 10, "0"),
        marginIzquierda,
        yInicial + 4
      );

      // Razón social
      this.pdf.text(datos.RAZON_SOCIAL, marginIzquierda, yInicial + 9);

      // Distrito
      this.pdf.text(
        datos.DISTRITO_DOMICILIO_FISCAL,
        marginIzquierda,
        yInicial + 13
      );

      // Domicilio fiscal
      this.pdf.text(datos.DOMICILIO_FISCAL, marginIzquierda, yInicial + 17);
    } catch (error) {
      console.error("Error in HAD:", error);
      this.handleError(error);
    }
  }

  // Método para generar formato HLP
  async generateHLP(datos, entidad, periodo) {
    try {
      await this.loadFormat("HLP", entidad, periodo);
      // const imagePath = `formato/${entidad}/${periodo}/imagenes/HLP.png`;
      // await this.addImageFromPath(imagePath);

      this.pdf.setFontSize(7);

      // Datos básicos
      this.pdf.text(datos.adicional.documento, 8, 36);
      this.pdf.text(datos.RAZON_SOCIAL, 46, 36);
      this.pdf.text(this.padLeft(datos.CODIGO, 10, "0"), 172, 36);

      // Número de predios
      const nroPredios = datos.hlp_npre.nro_predios;
      this.pdf.text(nroPredios.toString(), 8, 46);
      this.pdf.text(nroPredios.toString(), 38, 46);

      // Valores autovalúo
      this.pdf.text(this.formatNumber(datos.adicional.nautova), 66, 46);
      this.pdf.text(
        this.formatNumber(datos.adicional.nautova - datos.valorafectototal),
        119,
        46
      );
      this.pdf.text(this.formatNumber(datos.valorafectototal), 160, 46);
    } catch (error) {
      console.error("Error in HLP:", error);
      this.handleError(error);
    }
  }

  // Método para generar formato HLA
  async generateHLA(datos, entidad, periodo, codigoPredio) {
    try {
      await this.loadFormat("HLA", entidad, periodo);
      // const imagePath = `formato/${entidad}/${periodo}/imagenes/HLA.png`;
      // await this.addImageFromPath(imagePath);

      const predio = datos.hr_predios[codigoPredio];
      if (!predio) throw new Error("Predio no encontrado");

      this.pdf.setFontSize(7);

      // Datos básicos
      this.pdf.text(this.padLeft(datos.CODIGO, 10, "0"), 7.5, 36.7);
      this.pdf.text(datos.RAZON_SOCIAL, 28.5, 36.7);
      this.pdf.text(datos.adicional.documento, 130.5, 36.7);
      this.pdf.text(predio.pu_predio.condicion, 161, 36.7);
      this.pdf.text(predio.nporcen, 19.5, 36.7);

      // Dirección
      const direccion =
        `${predio.sectorpredio} ${predio.tipogrupohab} ${predio.grupourbano} ${predio.tipovia} ${predio.nombrevia} ${predio.direccion}`.trim();
      this.pdf.text(direccion, 31, 49.1);

      // Datos de arbitrios
      this.pdf.text(this.formatNumber(predio.hla_tasas.nfrente), 15.4, 60.7);
      this.pdf.text(this.formatNumber(predio.hla_cuotas.bc / 2), 27.9, 60.7);
      this.pdf.text(this.formatNumber(predio.hla_cuotas.bc / 2), 43.3, 60.7);
    } catch (error) {
      console.error("Error in HLA:", error);
      this.handleError(error);
    }
  }
}

export default PDFService;
