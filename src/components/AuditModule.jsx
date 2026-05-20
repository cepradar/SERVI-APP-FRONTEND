import React, { useState, useEffect } from "react";
import axios from "./utils/axiosConfig";
import DataTable from "./DataTable";

const AuditModule = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("TODOS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categorías disponibles
  const categorias = [
    { id: "TODOS", label: "Todos", icon: "📊" },
    { id: "INVENTARIO", label: "Inventario", icon: "📦" },
    { id: "VENTA", label: "Ventas", icon: "💰" },
    { id: "ORDEN", label: "Órdenes", icon: "🔧" },
  ];

  const cargarMovimientos = async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      if (categoriaActiva === "TODOS") {
        response = await axios.get("/api/auditoria/movimientos");
      } else if (categoriaActiva === "ORDEN") {
        response = await axios.get("/api/auditoria/ordenes");
      } else {
        response = await axios.get(`/api/auditoria/categoria/${categoriaActiva}`);
      }
      // Asegurar que siempre sea un array
      const data = Array.isArray(response.data) ? response.data : [];
      setMovimientos(data);
    } catch (err) {
      setError("Error al cargar movimientos: " + (err.response?.data?.message || err.message));
      console.error("Error:", err);
      setMovimientos([]); // Resetear a array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
  };

  useEffect(() => {
    cargarMovimientos();
  }, [categoriaActiva]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerColorTipo = (tipoEventoNombre) => {
    if (!tipoEventoNombre) return "bg-gray-100 text-gray-800";
    const tipoUpper = tipoEventoNombre.toUpperCase();
    
    // Eventos de entrada/ingreso
    if (tipoUpper.includes("ENTRADA") || tipoUpper.includes("CREACION") || tipoUpper.includes("COMPRA")) {
      return "bg-green-100 text-green-800";
    } 
    // Eventos de salida/eliminación
    else if (tipoUpper.includes("SALIDA") || tipoUpper.includes("ELIMINACION") || tipoUpper.includes("VENTA")) {
      return "bg-red-100 text-red-800";
    } 
    // Eventos de ajuste
    else if (tipoUpper.includes("AJUSTE")) {
      return "bg-yellow-100 text-yellow-800";
    }
    // Eventos de servicio
    else if (tipoUpper.includes("SERVICIO") || tipoUpper.includes("ORDEN")) {
      return "bg-purple-100 text-purple-800";
    }
    // Eventos de garantía
    else if (tipoUpper.includes("GARANTIA")) {
      return "bg-orange-100 text-orange-800";
    }
    // Por defecto
    else {
      return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="p-2 md:p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">📊 Auditoría del Sistema</h1>

        {error && (
          <div className="mb-3 p-2 md:p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Pestañas por categoría */}
        <div className="mb-3 bg-white rounded shadow overflow-hidden">
          <div className="flex flex-wrap md:flex-nowrap border-b border-gray-200 overflow-x-auto">
            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => handleCategoriaChange(categoria.id)}
                className={`flex items-center justify-center gap-1.5 px-2 md:px-4 py-2 md:py-3 font-medium transition-colors text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  categoriaActiva === categoria.id
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-50 border-b-2 border-transparent"
                }`}
              >
                <span className="text-lg md:text-base">{categoria.icon}</span>
                <span className="hidden sm:inline">{categoria.label}</span>
              </button>
            ))}
            <button
              onClick={cargarMovimientos}
              className="ml-auto h-9 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 flex-shrink-0 text-xs md:text-sm"
              title="Recargar datos"
            >
              🔄 <span className="hidden sm:inline">Recargar</span>
            </button>
          </div>
        </div>

        {/* Tabla de movimientos */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Cargando movimientos...</p>
          </div>
        ) : (
          <div>
              <DataTable
                title="Movimientos de auditoria"
                data={movimientos}
                columns={[
                  {
                    key: "fecha",
                    label: "Fecha",
                    sortable: true,
                    filterable: true,
                    render: (mov) => formatearFecha(mov.fecha)
                  },
                  {
                    key: "productName",
                    label: "Producto",
                    sortable: true,
                    filterable: true,
                    render: (mov) => mov.productName || "-"
                  },
                  {
                    key: "cantidadInicial",
                    label: "Cant. Inicial",
                    sortable: true,
                    filterable: false,
                    render: (mov) => mov.cantidadInicial ?? "-"
                  },
                  {
                    key: "cantidadFinal",
                    label: "Cant. Final",
                    sortable: true,
                    filterable: false,
                    render: (mov) => mov.cantidadFinal ?? "-"
                  },
                  {
                    key: "precioInicial",
                    label: "Precio Inicial",
                    sortable: true,
                    filterable: false,
                    render: (mov) => mov.precioInicial ?? "-"
                  },
                  {
                    key: "precioFinal",
                    label: "Precio Final",
                    sortable: true,
                    filterable: false,
                    render: (mov) => mov.precioFinal ?? "-"
                  },
                  {
                    key: "tipoEventoNombre",
                    label: "Tipo",
                    sortable: true,
                    filterable: false,
                    render: (mov) => (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${obtenerColorTipo(mov.tipoEventoNombre)}`}
                      >
                        {mov.tipoEventoNombre || "-"}
                      </span>
                    )
                  },
                  {
                    key: "descripcion",
                    label: "Descripcion",
                    sortable: false,
                    filterable: false,
                    render: (mov) => mov.descripcion || "-"
                  },
                  {
                    key: "usuarioNombreCompleto",
                    label: "Usuario",
                    sortable: true,
                    filterable: true,
                    render: (mov) => mov.usuarioNombreCompleto || mov.usuarioUsername
                  },
                  {
                    key: "referencia",
                    label: "Referencia",
                    sortable: true,
                    filterable: false,
                    render: (mov) => mov.referencia || "-"
                  }
                ]}
              />
          </div>
        )}

        {/* Resumen */}
        {movimientos.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm mb-2">Total de Movimientos</p>
              <p className="text-3xl font-bold text-gray-900">{movimientos.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm mb-2">Últimas 24 horas</p>
              <p className="text-3xl font-bold text-blue-600">
                {movimientos.filter((m) => {
                  const fecha = new Date(m.fecha);
                  const ahora = new Date();
                  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
                  return fecha >= hace24h;
                }).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm mb-2">Usuarios involucrados</p>
              <p className="text-3xl font-bold text-purple-600">
                {new Set(movimientos.map((m) => m.usuarioUsername)).size}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditModule;
