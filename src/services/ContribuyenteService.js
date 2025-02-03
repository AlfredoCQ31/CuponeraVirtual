// services/ContribuyenteService.js
import axios from "axios";
//http://localhost:5174/formato/MDDA/2025/formatos/HR.pdf
//http://localhost:5174/formato/MDDA/2025/formatos/HR.pdf
class ContribuyenteService {
  constructor() {
    this.cache = new Map();
    this.baseURL = "/data/contribuyentes"; // Directorio donde estarán los JSON
  }

  async fetchContribuyente(codigo) {
    // Revisa primero en el caché
    if (this.cache.has(codigo)) {
      return this.cache.get(codigo);
    }

    try {
      // Obtener el archivo JSON directamente
      const response = await axios.get(`${this.baseURL}/${codigo}.json`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      // Guardar en caché
      this.cache.set(codigo, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error loading contribuyente ${codigo}:`, error);
      throw new Error(`No se encontró el contribuyente ${codigo}`);
    }
  }

  // Método para cargar múltiples contribuyentes a la vez
  async fetchMultipleContribuyentes(start, end) {
    const contribuyentes = [];
    const promises = [];

    for (let i = start; i <= end; i++) {
      if (!this.cache.has(i)) {
        promises.push(
          this.fetchContribuyente(i)
            .then((data) => {
              contribuyentes[i] = data;
            })
            .catch((error) => {
              console.warn(`Contribuyente ${i} no encontrado:`, error);
              contribuyentes[i] = null;
            })
        );
      } else {
        contribuyentes[i] = this.cache.get(i);
      }
    }

    await Promise.allSettled(promises);
    return contribuyentes.filter((c) => c !== null);
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }
}

export default new ContribuyenteService();
