import React, { useState, useEffect, useMemo } from "react";
import api from "./utils/axiosConfig";
import DataTable from "./DataTable";
import { usePermissions } from './utils/PermissionsContext';

const SalesModule = () => {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  // Tab activa en el buscador de ítems: 'PRODUCTO' | 'SERVICIO'
  const [itemTab, setItemTab] = useState('PRODUCTO');
  const [servicioCodeInput, setServicioCodeInput] = useState("");
  const [showServicioSearch, setShowServicioSearch] = useState(false);
  const [servicioFilter, setServicioFilter] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [clientMatches, setClientMatches] = useState([]);
  const [showClientMatches, setShowClientMatches] = useState(false);
  const [productCodeInput, setProductCodeInput] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [pendingPriceItemId, setPendingPriceItemId] = useState(null);
  const [priceEditItemId, setPriceEditItemId] = useState(null);
  const [productFilters, setProductFilters] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria: "",
    electrodomestico: "",
    soloActivos: true,
    minPrecio: "",
    maxPrecio: "",
    minStock: ""
  });

  const [formulario, setFormulario] = useState({
    documento: "",
    nombreComprador: "",
    telefonoComprador: "",
    emailComprador: "",
    observaciones: "",
    items: []
  });

  // Cargar ventas y productos al montar
  useEffect(() => {
    cargarVentas();
    cargarProductos();
    cargarServicios();
  }, []);

  const cargarVentas = async () => {
    try {
      const response = await api.get("/api/ventas/listar");
      // Asegurar que siempre sea un array
      const data = Array.isArray(response.data) ? response.data : [];
      setVentas(data);
    } catch (err) {
      console.error("Error al cargar ventas:", err);
      setVentas([]); // Resetear a array vacío en caso de error
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await api.get("/api/products/listar");
      const data = Array.isArray(response.data) ? response.data : [];
      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.get("/api/servicios/activos");
      const data = Array.isArray(response.data) ? response.data : [];
      setServicios(data);
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "documento") {
      setClienteEncontrado(null);
      setPriceEditItemId(null);
      setPendingPriceItemId(null);
      setShowPriceConfirm(false);
    }
    setFormulario({ ...formulario, [name]: value });
  };

  const handleDocumentoKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await fetchClienteByDocumento(formulario.documento);
  };

  const fetchClienteByDocumento = async (documento) => {
    if (!documento || !documento.trim()) {
      setError("Ingresa un documento válido");
      return;
    }

    try {
      setError("");
      const response = await api.get(`/api/clientes/${documento.trim()}`);
      const data = response.data;

      if (Array.isArray(data)) {
        if (data.length === 1) {
          seleccionarCliente(data[0]);
        } else if (data.length > 1) {
          setClientMatches(data);
          setShowClientMatches(true);
        } else {
          setClienteEncontrado(null);
          setError("Cliente no encontrado con ese documento");
        }
        return;
      }

      if (data) {
        seleccionarCliente(data);
      } else {
        setClienteEncontrado(null);
        setError("Cliente no encontrado con ese documento");
      }
    } catch (err) {
      setClienteEncontrado(null);
      setError("Cliente no encontrado con ese documento");
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteEncontrado(cliente);
    setFormulario((prev) => ({
      ...prev,
      documento: cliente?.documento || prev.documento,
      nombreComprador: cliente?.nombre || prev.nombreComprador,
      telefonoComprador: cliente?.telefono || "",
      emailComprador: cliente?.email || ""
    }));
    setClientMatches([]);
    setShowClientMatches(false);
  };

  const addProductoToItems = (producto) => {
    setFormulario((prev) => {
      const existing = prev.items.find(
        (item) => item.tipoItem === 'PRODUCTO' && String(item.productId) === String(producto.id)
      );

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.tipoItem === 'PRODUCTO' && String(item.productId) === String(producto.id)
              ? { ...item, cantidad: parseInt(item.cantidad || 0) + 1 }
              : item
          )
        };
      }

      const nuevoItem = {
        id: `P-${producto.id}-${Date.now()}`,
        tipoItem: 'PRODUCTO',
        productId: producto.id,
        productName: producto.name,
        cantidad: 1,
        precioUnitario: producto.price || 0
      };

      return { ...prev, items: [...prev.items, nuevoItem] };
    });
  };

  const addServicioToItems = (servicio) => {
    setFormulario((prev) => {
      const existing = prev.items.find(
        (item) => item.tipoItem === 'SERVICIO' && String(item.servicioId) === String(servicio.id)
      );

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.tipoItem === 'SERVICIO' && String(item.servicioId) === String(servicio.id)
              ? { ...item, cantidad: parseInt(item.cantidad || 0) + 1 }
              : item
          )
        };
      }

      const nuevoItem = {
        id: `S-${servicio.id}-${Date.now()}`,
        tipoItem: 'SERVICIO',
        servicioId: servicio.id,
        productName: servicio.nombre,   // Reusa el campo display para la tabla
        cantidad: 1,
        precioUnitario: servicio.precioBase || 0
      };

      return { ...prev, items: [...prev.items, nuevoItem] };
    });
  };

  const getCategoryId = (producto) =>
    producto?.categoryId || producto?.category?.id || "";

  const clienteValido = Boolean(clienteEncontrado?.documento);

  const handleAddItemByCode = () => {
    if (!clienteValido) {
      setError("Debes cargar un cliente valido antes de agregar productos");
      return;
    }
    const code = productCodeInput.trim();
    if (!code) {
      setError("Ingresa un codigo de producto");
      return;
    }

    const producto = productos.find((p) => String(p.id) === String(code));
    if (!producto) {
      setError("Producto no encontrado con ese codigo");
      return;
    }

    if (producto.activo === false) {
      setError("El producto seleccionado esta inactivo");
      return;
    }

    if (getCategoryId(producto) === "S") {
      setError("Los productos de tipo SERVICIO no se pueden vender aqui");
      return;
    }

    addProductoToItems(producto);
    setProductCodeInput("");
    setError("");
  };

  const handleProductCodeKeyDown = (e) => {
    if (!clienteValido) {
      e.preventDefault();
      setError("Debes cargar un cliente valido antes de buscar productos");
      return;
    }
    if (e.key === "F2") {
      e.preventDefault();
      setShowProductSearch(true);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItemByCode();
    }
  };

  const handleSelectProducto = (producto) => {
    if (!clienteValido) {
      setShowProductSearch(false);
      setError("Debes cargar un cliente valido antes de agregar productos");
      return;
    }
    if (!producto) {
      return;
    }

    if (producto.activo === false) {
      setError("El producto seleccionado esta inactivo");
      return;
    }

    if (getCategoryId(producto) === "S") {
      setError("Los productos de tipo SERVICIO no se pueden vender aqui");
      return;
    }

    addProductoToItems(producto);
    setProductCodeInput("");
    setShowProductSearch(false);
    setError("");
  };

  const updateProductFilter = (field, value) => {
    setProductFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRemoveItem = (itemId) => {
    if (!clienteValido) {
      setError("Debes cargar un cliente valido antes de editar productos");
      return;
    }
    if (priceEditItemId === itemId) {
      setPriceEditItemId(null);
    }
    if (pendingPriceItemId === itemId) {
      setPendingPriceItemId(null);
      setShowPriceConfirm(false);
    }
    setFormulario((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId)
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    if (!clienteValido) {
      setError("Debes cargar un cliente valido antes de editar productos");
      return;
    }
    setFormulario((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const requestPriceEdit = (itemId) => {
    if (priceEditItemId === itemId) {
      return;
    }
    setPendingPriceItemId(itemId);
    setShowPriceConfirm(true);
  };

  const confirmPriceEdit = () => {
    if (!pendingPriceItemId) {
      setShowPriceConfirm(false);
      return;
    }
    setPriceEditItemId(pendingPriceItemId);
    setPendingPriceItemId(null);
    setShowPriceConfirm(false);
  };

  const cancelPriceEdit = () => {
    setPendingPriceItemId(null);
    setShowPriceConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Validaciones
      if (!formulario.documento || !clienteEncontrado) {
        setError("Debes ingresar un documento válido y cargar el cliente");
        setLoading(false);
        return;
      }

      if (!clienteEncontrado?.documento || !clienteEncontrado?.tipoDocumentoId) {
        setError("El cliente seleccionado no tiene documento o tipo de documento");
        setLoading(false);
        return;
      }

      if (formulario.items.length === 0) {
        setError("Agrega al menos un producto a la venta");
        setLoading(false);
        return;
      }

      for (const item of formulario.items) {
        if (item.tipoItem === 'SERVICIO') {
          // Servicios: solo validar que exista y la cantidad
          if (!item.servicioId) {
            setError("Hay servicios inválidos en la venta");
            setLoading(false);
            return;
          }
          if (!item.cantidad || item.cantidad <= 0) {
            setError("La cantidad debe ser mayor a 0");
            setLoading(false);
            return;
          }
        } else {
          // Productos físicos: validar stock
          if (!item.productId) {
            setError("Hay productos inválidos en la venta");
            setLoading(false);
            return;
          }
          if (!item.cantidad || item.cantidad <= 0) {
            setError("La cantidad debe ser mayor a 0");
            setLoading(false);
            return;
          }
          const producto = productos.find((p) => String(p.id) === String(item.productId));
          if (!producto) {
            setError(`Producto no encontrado: ${item.productId}`);
            setLoading(false);
            return;
          }
          if (producto.quantity < item.cantidad) {
            setError(`No hay suficiente cantidad de ${producto.name}. Disponible: ${producto.quantity}`);
            setLoading(false);
            return;
          }
        }
      }

      const payload = {
        clienteId: clienteEncontrado.documento,
        clienteTipoDocumento: clienteEncontrado.tipoDocumentoId,
        // usuarioUsername es ignorado por el backend — se toma del JWT
        observaciones: formulario.observaciones,
        detalles: formulario.items.map((item) => ({
          productId: item.tipoItem === 'SERVICIO' ? undefined : item.productId,
          servicioId: item.tipoItem === 'SERVICIO' ? item.servicioId : undefined,
          tipoItem: item.tipoItem || 'PRODUCTO',
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
      };
      const response = await api.post("/api/ventas/registrar", payload);
      const totalVenta = parseFloat(response.data?.totalVenta || 0);

      setSuccessMessage(
        `¡Venta registrada exitosamente! Total: $${totalVenta.toFixed(2)}`
      );

      // Limpiar formulario
      setFormulario({
        documento: "",
        nombreComprador: "",
        telefonoComprador: "",
        emailComprador: "",
        observaciones: "",
        items: []
      });
      setClienteEncontrado(null);
      setProductCodeInput("");
      setPriceEditItemId(null);
      setPendingPriceItemId(null);
      setShowPriceConfirm(false);

      // Recargar ventas y productos
      cargarVentas();
      cargarProductos();
      cargarServicios();
      setMostrarFormulario(false);

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(
        "Error al registrar venta: " + (err.response?.data?.message || err.message)
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const calcularTotal = () => {
    return formulario.items
      .reduce((total, item) => total + (parseFloat(item.cantidad || 0) * parseFloat(item.precioUnitario || 0)), 0)
      .toFixed(2);
  };

  const filteredProductos = useMemo(() => {
    let result = productos;
    const {
      codigo,
      nombre,
      descripcion,
      categoria,
      electrodomestico,
      soloActivos,
      minPrecio,
      maxPrecio,
      minStock
    } = productFilters;

    if (soloActivos) {
      result = result.filter((p) => p.activo !== false);
    }

    if (codigo) {
      const value = codigo.toLowerCase();
      result = result.filter((p) => String(p.id || "").toLowerCase().includes(value));
    }

    if (nombre) {
      const value = nombre.toLowerCase();
      result = result.filter((p) => String(p.name || "").toLowerCase().includes(value));
    }

    if (descripcion) {
      const value = descripcion.toLowerCase();
      result = result.filter((p) =>
        String(p.description || "").toLowerCase().includes(value)
      );
    }

    if (categoria) {
      const value = categoria.toLowerCase();
      result = result.filter((p) =>
        String(getCategoryId(p)).toLowerCase().includes(value)
      );
    }

    if (electrodomestico) {
      const value = electrodomestico.toLowerCase();
      result = result.filter((p) =>
        String(p.categoriaElectrodomesticoId || "").toLowerCase().includes(value)
      );
    }

    const minPrecioValue = parseFloat(minPrecio);
    if (!Number.isNaN(minPrecioValue)) {
      result = result.filter((p) => parseFloat(p.price || 0) >= minPrecioValue);
    }

    const maxPrecioValue = parseFloat(maxPrecio);
    if (!Number.isNaN(maxPrecioValue)) {
      result = result.filter((p) => parseFloat(p.price || 0) <= maxPrecioValue);
    }

    const minStockValue = parseInt(minStock, 10);
    if (!Number.isNaN(minStockValue)) {
      result = result.filter((p) => parseInt(p.quantity || 0, 10) >= minStockValue);
    }

    result = result.filter((p) => getCategoryId(p) !== "S");

    return result;
  }, [productos, productFilters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {!mostrarFormulario && (
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-sm md:text-base font-bold">
              Historial de ventas ({ventas.length})
            </h3>
            {can('sales.create') && (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="h-9 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                + Nueva Venta
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Formulario de venta */}
        {mostrarFormulario && (
          <div className="mb-6 bg-white p-4 md:p-5 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Documento */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Documento *
                </label>
                <input
                  type="text"
                  name="documento"
                  value={formulario.documento}
                  onChange={handleInputChange}
                  onKeyDown={handleDocumentoKeyDown}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Número de documento"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Enter para buscar</p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombreComprador"
                  value={formulario.nombreComprador}
                  onChange={handleInputChange}
                  required
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Nombre completo"
                />
              </div>

              {/* Producto */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Codigo de producto *
                </label>
                {/* Tabs Producto / Servicio */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden mb-1">
                  <button
                    type="button"
                    onClick={() => setItemTab('PRODUCTO')}
                    className={`flex-1 h-8 text-xs font-medium transition-colors ${
                      itemTab === 'PRODUCTO'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemTab('SERVICIO')}
                    className={`flex-1 h-8 text-xs font-medium transition-colors ${
                      itemTab === 'SERVICIO'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Servicio
                  </button>
                </div>
                {itemTab === 'PRODUCTO' ? (
                  <>
                    <input
                      type="text"
                      name="productCode"
                      value={productCodeInput}
                      onChange={(e) => setProductCodeInput(e.target.value)}
                      onKeyDown={handleProductCodeKeyDown}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Codigo del producto"
                      disabled={!clienteValido}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {clienteValido ? "Enter agrega, F2 busca" : "Primero carga un cliente valido"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={servicioCodeInput}
                        onChange={(e) => setServicioCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!clienteValido) { setError("Carga un cliente primero"); return; }
                            const srv = servicios.find((s) =>
                              String(s.id) === servicioCodeInput.trim() ||
                              s.codigo?.toLowerCase() === servicioCodeInput.trim().toLowerCase()
                            );
                            if (!srv) { setError("Servicio no encontrado"); return; }
                            addServicioToItems(srv);
                            setServicioCodeInput("");
                            setError("");
                          }
                        }}
                        className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        placeholder="ID o código del servicio"
                        disabled={!clienteValido}
                      />
                      <button
                        type="button"
                        disabled={!clienteValido}
                        onClick={() => setShowServicioSearch(true)}
                        className="h-9 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs disabled:bg-gray-300"
                      >
                        Buscar
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {clienteValido ? "Enter agrega por ID/código, o usa Buscar" : "Primero carga un cliente"}
                    </p>
                  </>
                )}
              </div>

              {/* Lista de productos */}
              <div className="md:col-span-3">
                {formulario.items.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay productos agregados</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Producto</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Cantidad</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Precio Unit.</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">Subtotal</th>
                          <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formulario.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                                item.tipoItem === 'SERVICIO'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.tipoItem === 'SERVICIO' ? 'SRV' : 'PRD'}
                              </span>
                              {item.productName}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(item.id, 'cantidad', parseInt(e.target.value || 0))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={!clienteValido}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precioUnitario}
                                readOnly={priceEditItemId !== item.id}
                                onChange={(e) => handleItemChange(item.id, 'precioUnitario', parseFloat(e.target.value || 0))}
                                onClick={() => requestPriceEdit(item.id)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm read-only:bg-gray-100 read-only:text-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={!clienteValido}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              ${(parseFloat(item.cantidad || 0) * parseFloat(item.precioUnitario || 0)).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700 text-xs disabled:text-gray-400"
                                disabled={!clienteValido}
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-base font-bold text-gray-900">
                  ${calcularTotal()}
                </div>
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formulario.observaciones}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows="2"
                  placeholder="Notas adicionales (opcional)"
                ></textarea>
              </div>

              {/* Botones */}
              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:bg-gray-400 text-sm"
                >
                  {loading ? "Registrando..." : "Registrar Venta"}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 h-9 px-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {!mostrarFormulario && (
          <>
            {/* Tabla de ventas */}
            <DataTable
                  data={ventas}
                  columns={[
                    {
                      key: "fecha",
                      label: "Fecha",
                      sortable: true,
                      filterable: true,
                      render: (venta) => formatearFecha(venta.fecha)
                    },
                    {
                      key: "productNombre",
                      label: "Producto",
                      sortable: true,
                      filterable: true,
                      render: (venta) => venta.productNombre || "-"
                    },
                    {
                      key: "nombreComprador",
                      label: "Comprador",
                      sortable: true,
                      filterable: true,
                      render: (venta) => venta.nombreComprador || "-"
                    },
                    {
                      key: "cantidad",
                      label: "Cantidad",
                      sortable: true,
                      filterable: false,
                      render: (venta) => venta.cantidad ?? "-"
                    },
                    {
                      key: "precioUnitario",
                      label: "Precio Unit.",
                      sortable: true,
                      filterable: false,
                      render: (venta) =>
                        venta.precioUnitario != null ? `$${venta.precioUnitario}` : "-"
                    },
                    {
                      key: "totalVenta",
                      label: "Total",
                      sortable: true,
                      filterable: false,
                      render: (venta) => (
                        <span className="font-semibold text-green-600">
                          {venta.totalVenta != null ? `$${venta.totalVenta}` : "-"}
                        </span>
                      )
                    },
                    {
                      key: "usuarioNombre",
                      label: "Usuario",
                      sortable: true,
                      filterable: true,
                      render: (venta) => venta.usuarioNombre || "-"
                    }
                  ]}
              />

            {/* Resumen */}
            {ventas.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-600 text-sm mb-2">Total Ventas</p>
                  <p className="text-3xl font-bold text-gray-900">{ventas.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-600 text-sm mb-2">Monto Total</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${ventas
                      .reduce((total, v) => total + parseFloat(v.totalVenta || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-600 text-sm mb-2">Promedio por Venta</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${(
                      ventas.reduce((total, v) => total + parseFloat(v.totalVenta || 0), 0) /
                      ventas.length
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {showPriceConfirm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar cambio de precio
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700">
                  ¿Deseas cambiar el precio del producto seleccionado?
                </p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={confirmPriceEdit}
                  className="flex-1 h-9 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                >
                  Si, cambiar
                </button>
                <button
                  type="button"
                  onClick={cancelPriceEdit}
                  className="flex-1 h-9 px-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showClientMatches && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Selecciona el cliente
                </h3>
                <button
                  type="button"
                  onClick={() => setShowClientMatches(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-3">
                  Se encontraron varias coincidencias. Doble click para seleccionar.
                </p>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Documento</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Tipo</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Nombre</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Telefono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientMatches.map((cliente) => (
                        <tr
                          key={`${cliente.documento}-${cliente.tipoDocumentoId || ""}`}
                          onDoubleClick={() => seleccionarCliente(cliente)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-2 text-sm text-gray-900">{cliente.documento}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {cliente.tipoDocumentoName || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{cliente.nombre}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{cliente.telefono || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {showProductSearch && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200/70">
              <div className="px-4 py-3 border-b border-slate-200/70 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Busqueda rapida
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter agrega, F2 abre, doble click selecciona.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(false)}
                  className="text-slate-500 hover:text-slate-700 text-sm"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    value={productFilters.codigo}
                    onChange={(e) => updateProductFilter("codigo", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Codigo"
                  />
                  <input
                    type="text"
                    value={productFilters.nombre}
                    onChange={(e) => updateProductFilter("nombre", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Nombre"
                  />
                  <input
                    type="text"
                    value={productFilters.descripcion}
                    onChange={(e) => updateProductFilter("descripcion", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Descripcion"
                  />
                  <input
                    type="text"
                    value={productFilters.categoria}
                    onChange={(e) => updateProductFilter("categoria", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Categoria"
                  />
                  <input
                    type="text"
                    value={productFilters.electrodomestico}
                    onChange={(e) => updateProductFilter("electrodomestico", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Electrodomestico"
                  />
                  <input
                    type="number"
                    value={productFilters.minPrecio}
                    onChange={(e) => updateProductFilter("minPrecio", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Min $"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={productFilters.maxPrecio}
                    onChange={(e) => updateProductFilter("maxPrecio", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Max $"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={productFilters.minStock}
                    onChange={(e) => updateProductFilter("minStock", e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Stock min"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 bg-white/80 border border-slate-200 rounded-full px-3 py-1">
                    <input
                      type="checkbox"
                      checked={productFilters.soloActivos}
                      onChange={(e) => updateProductFilter("soloActivos", e.target.checked)}
                    />
                    Solo activos
                  </label>
                  <span className="text-xs text-slate-500">
                    {filteredProductos.length} resultados
                  </span>
                </div>

                <div className="max-h-[45vh] overflow-y-auto border border-slate-200 rounded-xl bg-white/70">
                  <table className="w-full">
                    <thead className="bg-slate-100/80 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Codigo</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Nombre</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Descripcion</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Precio</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Stock</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Categoria</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Electrodomestico</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-slate-900">Activo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredProductos.map((producto) => (
                        <tr
                          key={producto.id}
                          onDoubleClick={() => handleSelectProducto(producto)}
                          className="hover:bg-amber-50/60 cursor-pointer"
                        >
                          <td className="px-2 py-2 text-xs text-slate-900">{producto.id}</td>
                          <td className="px-2 py-2 text-xs text-slate-900">{producto.name}</td>
                          <td className="px-2 py-2 text-xs text-slate-900">{producto.description || "-"}</td>
                          <td className="px-2 py-2 text-xs text-slate-900">${producto.price}</td>
                          <td className="px-2 py-2 text-xs text-slate-900">{producto.quantity}</td>
                          <td className="px-2 py-2 text-xs text-slate-900">
                            {getCategoryId(producto) || "-"}
                          </td>
                          <td className="px-2 py-2 text-xs text-slate-900">
                            {producto.categoriaElectrodomesticoId || "-"}
                          </td>
                          <td className="px-2 py-2 text-xs text-slate-900">
                            {producto.activo === false ? "No" : "Si"}
                          </td>
                        </tr>
                      ))}
                      {filteredProductos.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-xs text-slate-500 text-center" colSpan={8}>
                            No hay productos que coincidan con los filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal búsqueda de servicios */}
        {showServicioSearch && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200/70">
              <div className="px-4 py-3 border-b border-slate-200/70 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Buscar Servicio
                  </h3>
                  <p className="text-xs text-slate-500">Doble click para agregar a la venta.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServicioSearch(false)}
                  className="text-slate-500 hover:text-slate-700 text-sm"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  value={servicioFilter}
                  onChange={(e) => setServicioFilter(e.target.value)}
                  placeholder="Filtrar por nombre o código..."
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl bg-white/70">
                  <table className="w-full">
                    <thead className="bg-slate-100/80 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-900">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-900">Nombre</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-900">Categoría</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-900">Precio base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {servicios
                        .filter((s) => {
                          const q = servicioFilter.toLowerCase();
                          return !q ||
                            s.nombre?.toLowerCase().includes(q) ||
                            s.codigo?.toLowerCase().includes(q);
                        })
                        .map((srv) => (
                          <tr
                            key={srv.id}
                            onDoubleClick={() => {
                              addServicioToItems(srv);
                              setShowServicioSearch(false);
                              setServicioFilter("");
                            }}
                            className="hover:bg-purple-50/60 cursor-pointer"
                          >
                            <td className="px-3 py-2 text-xs text-slate-900">{srv.codigo}</td>
                            <td className="px-3 py-2 text-xs text-slate-900">{srv.nombre}</td>
                            <td className="px-3 py-2 text-xs text-slate-900">{srv.categoriaServicio || "-"}</td>
                            <td className="px-3 py-2 text-xs text-slate-900">${srv.precioBase}</td>
                          </tr>
                        ))}
                      {servicios.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-xs text-slate-500 text-center" colSpan={4}>
                            No hay servicios activos. Créalos desde el módulo de Servicios.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesModule;
