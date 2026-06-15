import React, { useEffect, useState } from "react";
import api from "./utils/axiosConfig";
import DataTable from "./DataTable";
import { usePermissions } from './utils/PermissionsContext';
import { useSedes } from '../context/SedesContext';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

/**
 * COMPONENTE REFACTORIZADO: OrdenServicio
 * 
 * CAMBIOS:
 * - Eliminada toda lógica de productos embebida
 * - Los productos ahora se manejan en el módulo de Ventas
 * - Una orden puede tener múltiples ventas asociadas
 * - Simplificado: solo maneja datos técnicos de la orden
 */
export default function OrdenServicio() {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  const { sedes, sedeActual } = useSedes();
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesParaAsignar, setOrdenesParaAsignar] = useState([]);
  const [ordenesTecnico, setOrdenesTecnico] = useState([]);
  // Ventas asociadas a la orden seleccionada
  const [ventasOrden, setVentasOrden] = useState([]);
  const [loadingVentasOrden, setLoadingVentasOrden] = useState(false);

  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [clienteElectrodomesticos, setClienteElectrodomesticos] = useState([]);
  const [selectedElectrodomestico, setSelectedElectrodomestico] = useState(null);
  const [activeView, setActiveView] = useState("LISTA");
  const [selectedOrdenEntrega, setSelectedOrdenEntrega] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicosError, setTecnicosError] = useState("");
  const [selectedOrdenAsignar, setSelectedOrdenAsignar] = useState("");
  const [selectedTecnico, setSelectedTecnico] = useState("");
  const [selectedOrdenCierre, setSelectedOrdenCierre] = useState("");
  const [cierreDetalles, setCierreDetalles] = useState([]);
  const [selectedDetalleId, setSelectedDetalleId] = useState(null);
  const [detalleForm, setDetalleForm] = useState({
    id: "",
    regServicio: null,
    servicioNombre: "",
    servicioCodigo: "",
    cierreTecnico: "",
    observaciones: "",
    diagnosticado: false,
    reparado: false,
  });
  const [clientMatches, setClientMatches] = useState([]);
  const [showClientMatches, setShowClientMatches] = useState(false);

  // Estado para la pestaña "Entregar Orden"
  const [ordenesParaEntregar, setOrdenesParaEntregar] = useState([]);
  const [selectedOrdenEntregarId, setSelectedOrdenEntregarId] = useState("");

  // Servicios activos para dropdown de tipoServicio
  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [servicioSeleccionadoKey, setServicioSeleccionadoKey] = useState("");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

  // Estado para el panel de venta en "Responder Orden"
  const [productos, setProductos] = useState([]);
  const [ventaItems, setVentaItems] = useState([]);
  const [ventaComprador, setVentaComprador] = useState({ nombre: "", telefono: "" });
  const [ventaObservaciones, setVentaObservaciones] = useState("");
  const [ventaProductoBuscado, setVentaProductoBuscado] = useState("");
  const [showVentaProductSearch, setShowVentaProductSearch] = useState(false);
  const [ventaProductFilter, setVentaProductFilter] = useState("");

  // Formulario simplificado: SIN items/productos
  const [formulario, setFormulario] = useState({
    codigoSede: sedeActual?.codigoSede || '',
    nit: "",
    nombreCliente: "",
    descripcionProblema: "",
    observaciones: ""
  });

  const opcionesServicio = serviciosActivos.length > 0
    ? serviciosActivos.map((servicio) => ({
        key: String(servicio.id),
        id: servicio.id,
        nombre: servicio.nombre,
        precioBase: Number(servicio.precioBase || 0),
      }))
    : [
        { key: "REPARACION", id: null, nombre: "Reparación", precioBase: 0 },
        { key: "MANTENIMIENTO", id: null, nombre: "Mantenimiento", precioBase: 0 },
        { key: "LATONERIA", id: null, nombre: "Latonería", precioBase: 0 },
      ];

  // Sincronizar sede actual cuando cambie el contexto
  useEffect(() => {
    if (sedeActual?.codigoSede) {
      setFormulario((prev) => ({ ...prev, codigoSede: sedeActual.codigoSede }));
    }
  }, [sedeActual]);

  // Formulario de cierre
  const [cierreForm, setCierreForm] = useState({
    diagnostico: "",
    solucion: "",
    partesCambiadas: "",
    garantiaServicio: 30,
    observaciones: ""
  });

  useEffect(() => {
    cargarOrdenes();
    cargarTecnicos();
    cargarServiciosActivos();
  }, []);

  const cargarServiciosActivos = async () => {
    try {
      const response = await api.get("/api/servicios/activos");
      const data = Array.isArray(response.data) ? response.data : [];
      setServiciosActivos(data);
    } catch (err) {
      console.error("Error al cargar servicios activos:", err);
    }
  };

  const cargarOrdenes = async () => {
    try {
      const response = await api.get("/api/servicios-reparacion/listar");
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenes(data);
    } catch (err) {
      console.error("Error al cargar ordenes:", err);
      setOrdenes([]);
    }
  };

  const cargarOrdenesParaAsignar = async () => {
    try {
      // Regla 2: solo trae órdenes en estado ORDEN_SERVICIO_CREADA
      const response = await api.get("/api/servicios-reparacion/pendientes-asignacion");
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenesParaAsignar(data);
    } catch (err) {
      console.error("Error al cargar órdenes para asignar:", err);
      setOrdenesParaAsignar([]);
    }
  };

  const cargarMisOrdenes = async () => {
    try {
      // Regla 4: solo trae las órdenes del técnico autenticado
      const response = await api.get("/api/servicios-reparacion/mis-ordenes");
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenesTecnico(data);
    } catch (err) {
      console.error("Error al cargar mis órdenes:", err);
      setOrdenesTecnico([]);
    }
  };

  const cargarOrdenesParaEntregar = async () => {
    try {
      const response = await api.get("/api/servicios-reparacion/ordenes-para-entregar");
      const data = Array.isArray(response.data) ? response.data : [];
      setOrdenesParaEntregar(data);
    } catch (err) {
      console.error("Error al cargar órdenes para entregar:", err);
      setOrdenesParaEntregar([]);
    }
  };

  const handleDescargarOrdenPdf = async (ordenId) => {
    if (!ordenId) return;
    try {
      const response = await api.get(`/api/servicios-reparacion/${ordenId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orden-servicio-${ordenId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al generar el PDF de la orden de servicio');
    }
  };

  const handleEntregarOrden = async () => {
    setLoading(true);
    setError("");
    try {
      await api.put(`/api/servicios-reparacion/${selectedOrdenEntregarId}/entregar`);
      setSuccessMessage(`Orden ${selectedOrdenEntregarId} entregada correctamente`);
      setSelectedOrdenEntregarId("");
      cargarOrdenesParaEntregar();
    } catch (err) {
      setError(err.message || err.response?.data || "Error al entregar la orden");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await api.get("/api/products/listar");
      const data = Array.isArray(response.data) ? response.data : [];
      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setProductos([]);
      if (err.status === 403) {
        setError("No tienes permisos para cargar el catálogo de productos.");
      }
    }
  };

  const cargarVentasOrden = async (ordenId) => {
    if (!ordenId) {
      setVentasOrden([]);
      return;
    }

    try {
      setLoadingVentasOrden(true);

      const response = await api.get(`/api/ventas/orden/${ordenId}`);

      const ventas = Array.isArray(response.data)
        ? response.data
        : [];

      setVentasOrden(ventas);
    } catch (err) {
      console.error("Error al cargar ventas de la orden:", err);
      setVentasOrden([]);
    } finally {
      setLoadingVentasOrden(false);
    }
  };

  const handleAgregarItemVenta = (productoId) => {
    const producto = productos.find((p) => String(p.id) === String(productoId));
    if (!producto) return;
    setVentaItems((prev) => {
      const existe = prev.find((i) => String(i.productId) === String(producto.id));
      if (existe) {
        return prev.map((i) =>
          String(i.productId) === String(producto.id)
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, {
        productId: producto.id,
        nombre: producto.name,
        cantidad: 1,
        precioUnitario: producto.price || 0,
      }];
    });
    setVentaProductoBuscado("");
  };

  const handleEliminarItemVenta = (idx) => {
    setVentaItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const calcularTotalVenta = () => {
    return ventaItems.reduce((acc, i) => acc + i.cantidad * Number(i.precioUnitario), 0);
  };

  const handleRegistrarVentaOrden = async () => {
    const ordenSeleccionada = ordenesTecnico.find((o) => o.id === selectedOrdenCierre);
    if (!ordenSeleccionada?.clienteId || !ordenSeleccionada?.clienteTipoDocumentoId) {
      setError("La orden seleccionada no tiene cliente asociado");
      return;
    }
    if (!ordenSeleccionada?.codigoSede) {
      setError("La orden seleccionada no tiene una sede válida asociada");
      return;
    }
    if (ventaItems.length === 0) { setError("Agrega al menos un producto a la venta"); return; }
    setLoading(true);
    setError("");
    try {
      for (const item of ventaItems) {
        if (!item.productId) {
          setError("Todos los productos deben tener un ID válido");
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

      const response = await api.post("/api/ventas/registrar", {
        codigoSede: ordenSeleccionada.codigoSede,
        clienteId: ordenSeleccionada.clienteId,
        clienteTipoDocumento: ordenSeleccionada.clienteTipoDocumentoId,
        observaciones: ventaObservaciones,
        ordenDeServicioId: selectedOrdenCierre || null,
        detalles: ventaItems.map((i) => ({
          productId: i.productId,
          tipoItem: "PRODUCTO",
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      });
      const totalVenta = parseFloat(response.data?.totalVenta || 0);
      setSuccessMessage(`¡Venta registrada exitosamente! Total: $${totalVenta.toFixed(2)}`);
      setVentaItems([]);
      setVentaObservaciones("");
      setVentaProductoBuscado("");
      cargarVentasOrden(selectedOrdenCierre);
    } catch (err) {
      const msg = err.message || err.response?.data || "Error al registrar la venta";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const cargarTecnicos = async () => {
    try {
      const response = await api.get("/api/users/technicians");
      const data = Array.isArray(response.data) ? response.data : [];
      setTecnicos(data);
      setTecnicosError("");
    } catch (err) {
      setTecnicos([]);
      setTecnicosError("No se pudo cargar la lista de técnicos");
    }
  };

  useEffect(() => {
    if (!clienteEncontrado) {
      setClienteElectrodomesticos([]);
      setSelectedElectrodomestico(null);
      return;
    }

    const fetchElectrodomesticos = async () => {
      try {
        const response = await api.get(
          `/api/cliente-electrodomestico/cliente/${clienteEncontrado.nit}/${clienteEncontrado.tipoDocumentoId}`
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setClienteElectrodomesticos(data);
        setSelectedElectrodomestico(null);
      } catch (err) {
        console.error("Error al cargar electrodomésticos:", err);
        setClienteElectrodomesticos([]);
      }
    };

    fetchElectrodomesticos();
  }, [clienteEncontrado]);

  useEffect(() => {
    if (!selectedOrdenCierre) {
      setVentasOrden([]);
      cargarVentasOrden(selectedOrdenCierre);
      setCierreForm({
        diagnostico: "",
        solucion: "",
        partesCambiadas: "",
        garantiaServicio: 30,
        observaciones: ""
      });
      setCierreDetalles([]);
      setSelectedDetalleId(null);
      setDetalleForm({
        id: "",
        regServicio: null,
        servicioNombre: "",
        servicioCodigo: "",
        cierreTecnico: "",
        observaciones: "",
        diagnosticado: false,
        reparado: false,
      });
      setVentaItems([]);
      setVentaComprador({ nombre: "", telefono: "" });
      return;
    }

    const ordenSeleccionada = ordenesTecnico.find((o) => o.id === selectedOrdenCierre);
    if (!ordenSeleccionada) return;

    cargarVentasOrden(selectedOrdenCierre);

    setCierreForm({
      diagnostico: ordenSeleccionada.diagnostico || "",
      solucion: ordenSeleccionada.solucion || "",
      partesCambiadas: ordenSeleccionada.partesCambiadas || "",
      garantiaServicio: ordenSeleccionada.garantiaServicio ?? 30,
      observaciones: ordenSeleccionada.observaciones || ""
    });
    setCierreDetalles(
      Array.isArray(ordenSeleccionada.detalles)
        ? ordenSeleccionada.detalles.map((detalle) => ({
            id: detalle.id,
            regServicio: detalle.regServicio,
            servicioNombre: detalle.servicioNombre,
            servicioCodigo: detalle.servicioCodigo,
            observaciones: detalle.observaciones || "",
            cierreTecnico: detalle.cierreTecnico || "",
            reparado: Boolean(detalle.reparado),
            diagnosticado: Boolean(detalle.diagnosticado),
          }))
        : []
    );
    setSelectedDetalleId(null);
    setDetalleForm({
      id: "",
      regServicio: null,
      servicioNombre: "",
      servicioCodigo: "",
      cierreTecnico: "",
      observaciones: "",
      diagnosticado: false,
      reparado: false,
    });
    // Auto-poblar datos del cliente para la venta
    setVentaItems([]);
    setVentaComprador({
      nombre: `${ordenSeleccionada.clienteNombre || ""} ${ordenSeleccionada.clienteApellido || ""}`.trim(),
      telefono: ordenSeleccionada.clienteTelefono || ""
    });
    setVentaObservaciones("");
  }, [selectedOrdenCierre, ordenesTecnico]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "nit") {
      setClienteEncontrado(null);
      setClientMatches([]);
      setShowClientMatches(false);
      setClienteElectrodomesticos([]);
      setSelectedElectrodomestico(null);
      setFormulario((prev) => ({
        ...prev,
        nit: value,
        nombreCliente: ""
      }));
      return;
    }

    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetalleCierreChange = (detalleId, field, value) => {
    setCierreDetalles((prev) =>
      prev.map((detalle) => {
        if (detalle.id !== detalleId) return detalle;
        const updated = { ...detalle, [field]: value };
        if (field === "cierreTecnico") {
          updated.diagnosticado = value.trim().length > 0 || updated.diagnosticado;
        }
        return updated;
      })
    );
  };

  const getDetalleSemaforo = (detalle) => {
    if (detalle?.reparado) {
      return {
        label: "REPARADO",
        dot: "bg-green-500",
        badge: "bg-green-100 text-green-800",
      };
    }
    if (detalle?.diagnosticado || detalle?.cierreTecnico?.trim()) {
      return {
        label: "DIAGNOSTICADO",
        dot: "bg-yellow-400",
        badge: "bg-yellow-100 text-yellow-800",
      };
    }
    return {
      label: "SIN RESPUESTA",
      dot: "bg-red-500",
      badge: "bg-red-100 text-red-800",
    };
  };

  const abrirFormularioDetalle = (detalle) => {
    if (!detalle) return;
    setSelectedDetalleId(detalle.id);
    setDetalleForm({
      id: detalle.id,
      regServicio: detalle.regServicio,
      servicioNombre: detalle.servicioNombre || "",
      servicioCodigo: detalle.servicioCodigo || "",
      cierreTecnico: detalle.cierreTecnico || "",
      observaciones: detalle.observaciones || "",
      diagnosticado: Boolean(detalle.diagnosticado || detalle.cierreTecnico?.trim()),
      reparado: Boolean(detalle.reparado),
    });
  };

  const cerrarFormularioDetalle = () => {
    setSelectedDetalleId(null);
    setDetalleForm({
      id: "",
      regServicio: null,
      servicioNombre: "",
      servicioCodigo: "",
      cierreTecnico: "",
      observaciones: "",
      diagnosticado: false,
      reparado: false,
    });
  };

  const handleDetalleFormChange = (field, value) => {
    setDetalleForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "cierreTecnico" && value.trim()) {
        updated.diagnosticado = true;
      }
      if (field === "reparado" && value) {
        updated.diagnosticado = true;
      }
      return updated;
    });
  };

  const handleAgregarServicioOrden = () => {
    if (!servicioSeleccionadoKey) {
      setError("Debes seleccionar un servicio para agregar");
      return;
    }

    const servicio = opcionesServicio.find((item) => item.key === servicioSeleccionadoKey);
    if (!servicio) {
      setError("El servicio seleccionado no es válido");
      return;
    }

    if (serviciosSeleccionados.some((item) => item.key === servicio.key)) {
      setError("Ese servicio ya fue agregado a la orden");
      return;
    }

    setServiciosSeleccionados((prev) => [...prev, servicio]);
    setServicioSeleccionadoKey("");
    setError("");
  };

  const handleQuitarServicioOrden = (serviceKey) => {
    setServiciosSeleccionados((prev) => prev.filter((item) => item.key !== serviceKey));
  };

  const seleccionarCliente = (cliente) => {
    if (!cliente) return;
    setClienteEncontrado(cliente);
    setFormulario((prev) => ({
      ...prev,
      nit: cliente.nit || prev.nit,
      nombreCliente: `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim()
    }));
    setClientMatches([]);
    setShowClientMatches(false);
    setError("");
  };

  const handleDocumentoKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (!formulario.nit.trim()) {
      setError("Por favor ingresa un nit");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get(
        `/api/clientes/${formulario.nit}`
      );
      const data = response.data;

      if (Array.isArray(data)) {
        if (data.length === 1) {
          seleccionarCliente(data[0]);
        } else if (data.length > 1) {
          setClienteEncontrado(null);
          setClientMatches(data);
          setShowClientMatches(true);
        } else {
          setClienteEncontrado(null);
          setClientMatches([]);
          setShowClientMatches(false);
          setError("Cliente no encontrado");
        }
      } else {
        seleccionarCliente(data);
      }
    } catch (err) {
      setError("No se pudo buscar el cliente");
      setClienteEncontrado(null);
      setClientMatches([]);
      setShowClientMatches(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearOrden = async (e) => {
    e.preventDefault();

    if (!clienteEncontrado) {
      setError("Debes cargar un cliente válido");
      return;
    }

    if (!formulario.codigoSede) {
      setError("Debes seleccionar una sede");
      return;
    }

    if (!selectedElectrodomestico) {
      setError("Debes seleccionar un electrodoméstico");
      return;
    }

    if (!formulario.descripcionProblema.trim()) {
      setError("La descripción del problema es requerida");
      return;
    }

    if (serviciosSeleccionados.length === 0) {
      setError("Debes agregar al menos un servicio a la orden");
      return;
    }

    try {
      setLoading(true);

      const resumenServicios = serviciosSeleccionados.map((servicio) => servicio.nombre).join(", ");

      const payload = {
        codigoSede: formulario.codigoSede,
        clienteId: clienteEncontrado.nit,
        clienteTipoDocumentoId: clienteEncontrado.tipoDocumentoId,
        electrodomesticoId: selectedElectrodomestico.id,
        tipoServicio: resumenServicios,
        descripcionProblema: formulario.descripcionProblema,
        observaciones: formulario.observaciones,
        detalles: serviciosSeleccionados.map((servicio) => ({
          servicioId: servicio.id,
          servicioNombre: servicio.nombre,
          cantidad: 1,
          precioUnitario: servicio.precioBase,
        })),
      };

      const response = await api.post(
        "/api/servicios-reparacion/registrar",
        payload
      );

      if (response.data) {
        setSuccessMessage(`Orden creada exitosamente: ${response.data.id}`);
        setFormulario({
          codigoSede: sedeActual?.codigoSede || '',
          nit: "",
          nombreCliente: "",
          descripcionProblema: "",
          observaciones: ""
        });
        setServicioSeleccionadoKey("");
        setServiciosSeleccionados([]);
        setClienteEncontrado(null);
        setSelectedElectrodomestico(null);
        setActiveView("LISTA");
        cargarOrdenes();

        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError("Error al crear la orden: " + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarTecnico = async () => {
    if (!selectedOrdenAsignar || !selectedTecnico) {
      setError("Selecciona una orden y un técnico");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Regla 3: llamar al endpoint dedicado que valida estado SOC y cambia a SOA
      await api.post(`/api/servicios-reparacion/${selectedOrdenAsignar}/asignar-tecnico`, {
        tecnicoUsername: selectedTecnico
      });

      setSuccessMessage("Técnico asignado correctamente. Estado actualizado a ORDEN_SERVICIO_ASIGNADA");
      setSelectedOrdenAsignar("");
      setSelectedTecnico("");
      // Refrescar todas las listas tras la asignación
      await Promise.all([cargarOrdenes(), cargarOrdenesParaAsignar()]);

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(
        "Error al asignar técnico: " +
        (err.response?.data || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCierreConEstado = async (nuevoEstado, mensajeExito) => {
    if (!selectedOrdenCierre) {
      setError("Selecciona una orden");
      return;
    }
    if (cierreDetalles.length === 0) {
      setError("La orden seleccionada no tiene servicios para cerrar");
      return;
    }
    if (nuevoEstado === "REPARADO" && cierreDetalles.some((detalle) => !detalle.reparado)) {
      setError("Todos los servicios de la orden deben marcarse como reparados antes de cerrar");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        diagnostico: cierreForm.diagnostico,
        solucion: cierreForm.solucion,
        partesCambiadas: cierreForm.partesCambiadas,
        garantiaServicio: cierreForm.garantiaServicio,
        observaciones: cierreForm.observaciones,
        detalles: cierreDetalles.map((detalle) => ({
          id: detalle.id,
          regServicio: detalle.regServicio,
          observaciones: detalle.observaciones,
          cierreTecnico: detalle.cierreTecnico,
          reparado: Boolean(detalle.reparado),
          diagnosticado: Boolean(detalle.diagnosticado || detalle.cierreTecnico?.trim()),
        })),
        estado: nuevoEstado,
      };

      await api.put(`/api/servicios-reparacion/${selectedOrdenCierre}/cerrar-tecnico`, payload);

      setSuccessMessage(mensajeExito);
      setCierreForm({
        diagnostico: "",
        solucion: "",
        partesCambiadas: "",
        garantiaServicio: 30,
        observaciones: ""
      });
      setCierreDetalles([]);
      setSelectedOrdenCierre("");
      await Promise.all([cargarOrdenes(), cargarMisOrdenes()]);

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Error al guardar/cambiar estado: " + (err.message || err.response?.data || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarServicioSeleccionado = async () => {
    if (!selectedDetalleId) {
      setError("Selecciona un servicio para responder");
      return;
    }

    const detallesActualizados = cierreDetalles.map((detalle) =>
      detalle.id === selectedDetalleId
        ? {
            ...detalle,
            cierreTecnico: detalleForm.cierreTecnico,
            observaciones: detalleForm.observaciones,
            diagnosticado: Boolean(detalleForm.diagnosticado || detalleForm.cierreTecnico.trim()),
            reparado: Boolean(detalleForm.reparado),
          }
        : detalle
    );

    setCierreDetalles(detallesActualizados);

    const todosReparados = detallesActualizados.length > 0 && detallesActualizados.every((detalle) => detalle.reparado);
    const nuevoEstado = todosReparados ? "REPARADO" : "EN_PROCESO";
    const mensajeExito = todosReparados
      ? "Servicio guardado y orden marcada como REPARADO"
      : "Servicio guardado y orden en proceso";

    try {
      setLoading(true);
      setError("");

      const payload = {
        diagnostico: cierreForm.diagnostico,
        solucion: cierreForm.solucion,
        partesCambiadas: cierreForm.partesCambiadas,
        garantiaServicio: cierreForm.garantiaServicio,
        observaciones: cierreForm.observaciones,
        detalles: detallesActualizados.map((detalle) => ({
          id: detalle.id,
          regServicio: detalle.regServicio,
          observaciones: detalle.observaciones,
          cierreTecnico: detalle.cierreTecnico,
          reparado: Boolean(detalle.reparado),
          diagnosticado: Boolean(detalle.diagnosticado || detalle.cierreTecnico?.trim()),
        })),
        estado: nuevoEstado,
      };

      await api.put(`/api/servicios-reparacion/${selectedOrdenCierre}/cerrar-tecnico`, payload);

      setSuccessMessage(mensajeExito);
      cerrarFormularioDetalle();
      await Promise.all([cargarOrdenes(), cargarMisOrdenes()]);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Error al guardar el cierre del servicio: " + (err.message || err.response?.data || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const detallesVentasOrden = ventasOrden.flatMap((venta) =>
    (venta.detalles || []).map((detalle) => ({
      ventaId: venta.id,
      producto: detalle.productNombre,
      cantidad: detalle.cantidad,
      precio: Number(detalle.precioUnitario || 0),
      subtotal: Number(detalle.subtotal || 0),
    }))
  );

  const totalGeneralVentasOrden = detallesVentasOrden.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );

  const columns = [
    { key: "id", label: "ID Orden" },
    {
      key: "clienteNombre",
      label: "Cliente",
      render: (row) => `${row.clienteNombre || ""} ${row.clienteApellido || ""}`
    },
    { key: "electrodomesticoTipo", label: "Electrodoméstico" },
    { key: "tipoServicio", label: "Tipo" },
    {
      key: "estado",
      label: "Estado",
      render: (row) => {
        const nombre = row.estado || row.codigoEstado || "-";
        const CONFIG_ESTADO = {
          ORDEN_SERVICIO_CREADA: { label: "Creada", cls: "bg-blue-100 text-blue-800" },
          ORDEN_SERVICIO_ASIGNADA: { label: "Asignada", cls: "bg-orange-100 text-orange-800" },
          ORDEN_SERVICIO_EN_PROCESO: { label: "En Proceso", cls: "bg-yellow-100 text-yellow-800" },
          ORDEN_SERVICIO_PAUSADA: { label: "Pausada", cls: "bg-gray-100 text-gray-700" },
          ORDEN_SERVICIO_DIAGNOSTICADA: { label: "Diagnosticada", cls: "bg-purple-100 text-purple-800" },
          ORDEN_SERVICIO_REPARADA: { label: "Reparada", cls: "bg-green-100 text-green-800" },
          ORDEN_SERVICIO_PRUEBA: { label: "En Prueba", cls: "bg-teal-100 text-teal-800" },
          ORDEN_SERVICIO_LISTA: { label: "Lista", cls: "bg-emerald-100 text-emerald-800" },
          ORDEN_SERVICIO_ENTREGADA: { label: "Entregada", cls: "bg-slate-100 text-slate-700" },
          ORDEN_SERVICIO_CANCELADA: { label: "Cancelada", cls: "bg-red-100 text-red-800" },
          ORDEN_SERVICIO_RECHAZADA: { label: "Rechazada", cls: "bg-rose-100 text-rose-800" },
        };
        const cfg = CONFIG_ESTADO[nombre];
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg ? cfg.cls : "bg-gray-100 text-gray-600"}`}>
            {cfg ? cfg.label : nombre}
          </span>
        );
      }
    },
    {
      key: "fechaIngreso",
      label: "Fecha",
      render: (row) => new Date(row.fechaIngreso).toLocaleDateString()
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Órdenes de Servicio</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-4 text-sm underline"
            >
              Descartar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setActiveView("LISTA");
              setError("");
            }}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeView === "LISTA"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Listar
          </button>
          {can('orders.create') && (
            <button
              onClick={() => {
                setActiveView("CREAR");
                setError("");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${activeView === "CREAR"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              Crear Orden
            </button>
          )}
          {can('orders.assign_tech') && (
            <button
              onClick={() => {
                setActiveView("ASIGNAR");
                setError("");
                cargarOrdenesParaAsignar(); // cargar solo órdenes SOC al abrir la vista
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${activeView === "ASIGNAR"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              Asignar Técnico
            </button>
          )}
          <button
            onClick={() => {
              setActiveView("Responder Orden");
              setError("");
              cargarMisOrdenes();
              cargarProductos();
            }}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeView === "Responder Orden"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Responder Orden
          </button>
          <button
            onClick={() => {
              setActiveView("ENTREGAR");
              setError("");
              cargarOrdenesParaEntregar();
            }}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeView === "ENTREGAR"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Entregar Orden
          </button>
        </div>

        {activeView === "LISTA" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Órdenes Registradas</h2>
            <DataTable columns={columns} data={ordenes} />
          </div>
        )}

        {activeView === "CREAR" && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Nueva Orden de Servicio</h2>

            <form onSubmit={handleCrearOrden} className="space-y-4">

              {/* Sede */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <BuildingOffice2Icon className="h-4 w-4 text-blue-600" />
                  Sede *
                </label>
                {sedes.length === 0 ? (
                  <div className="w-full px-4 py-2 flex items-center text-sm text-red-500 border border-red-300 rounded-lg bg-red-50">
                    Sin sedes asignadas — contacta al administrador
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      name="codigoSede"
                      value={formulario.codigoSede}
                      onChange={handleInputChange}
                      required
                      className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar sede...</option>
                      {sedes.filter((s) => s.activo !== false).map((s) => (
                        <option key={s.codigoSede} value={s.codigoSede}>
                          {s.nombre} ({s.codigoSede}) — {s.ciudad || ''}
                        </option>
                      ))}
                    </select>
                    {formulario.codigoSede && (() => {
                      const s = sedes.find((x) => x.codigoSede === formulario.codigoSede);
                      if (!s) return null;
                      const next = (s.consecutivoOrdenes ?? 0) + 1;
                      const prefix = s.prefijoOrdenes || 'O';
                      const preview = `${s.codigoSede}-${prefix}-${String(next).padStart(3, '0')}`;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">ID estimado:</span>
                          <span className="font-mono text-sm font-bold bg-purple-50 border border-purple-200 text-purple-800 px-2 py-1 rounded">
                            {preview}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIT / Documento Cliente
                </label>
                <input
                  type="text"
                  name="nit"
                  value={formulario.nit}
                  onChange={handleInputChange}
                  onKeyDown={handleDocumentoKeyDown}
                  placeholder="Ingresa y presiona Enter"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {clienteEncontrado && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Cliente: {clienteEncontrado.nombre}
                  </p>
                )}
              </div>

              {clienteEncontrado && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Electrodoméstico
                    </label>
                    <select
                      value={selectedElectrodomestico?.id || ""}
                      onChange={(e) => {
                        const selected = clienteElectrodomesticos.find(
                          (ce) => String(ce.id) === String(e.target.value)
                        );
                        setSelectedElectrodomestico(selected);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Selecciona electrodoméstico --</option>
                      {clienteElectrodomesticos.map((ce) => (
                        <option key={ce.id} value={ce.id}>
                          {ce.electrodomesticoTipo} - {ce.electrodomesticoMarca} {ce.electrodomesticoModelo}
                        </option>
                      ))}
                    </select>
                    {clienteElectrodomesticos.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600">
                        Este cliente no tiene electrodomésticos registrados para el tipo de documento seleccionado.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servicios de la Orden
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={servicioSeleccionadoKey}
                        onChange={(e) => setServicioSeleccionadoKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecciona un servicio</option>
                        {opcionesServicio.map((servicio) => (
                          <option key={servicio.key} value={servicio.key}>
                            {servicio.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAgregarServicioOrden}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Agregar
                      </button>
                    </div>

                    {serviciosSeleccionados.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {serviciosSeleccionados.map((servicio) => (
                          <div
                            key={servicio.key}
                            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">{servicio.nombre}</p>
                              <p className="text-xs text-gray-500">
                                Precio base: ${Number(servicio.precioBase || 0).toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuitarServicioOrden(servicio.key)}
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-amber-600">
                        Agrega uno o más servicios a la orden.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Problema
                    </label>
                    <textarea
                      name="descripcionProblema"
                      value={formulario.descripcionProblema}
                      onChange={handleInputChange}
                      placeholder="Describe el problema del electrodoméstico"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formulario.observaciones}
                      onChange={handleInputChange}
                      placeholder="Observaciones adicionales (opcional)"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Creando..." : "Crear Orden"}
                  </button>
                </>
              )}

              {!clienteEncontrado && formulario.nit && (
                <p className="text-sm text-yellow-600">
                  Presiona Enter para buscar el cliente
                </p>
              )}
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Una vez creada la orden, puedes agregar productos/servicios mediante el módulo de Ventas.
              </p>
            </div>
          </div>
        )}

        {activeView === "ASIGNAR" && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Asignar Técnico</h2>

            {tecnicosError && (
              <p className="text-sm text-red-600 mb-4">{tecnicosError}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona Orden <span className="text-xs text-gray-500">(solo órdenes en estado ORDEN_SERVICIO_CREADA)</span>
                </label>
                <select
                  value={selectedOrdenAsignar}
                  onChange={(e) => setSelectedOrdenAsignar(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona orden --</option>
                  {ordenesParaAsignar.map((orden) => (
                    <option key={orden.id} value={orden.id}>
                      {orden.id} - {orden.clienteNombre} ({orden.estado})
                    </option>
                  ))}
                </select>
                {ordenesParaAsignar.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No hay órdenes pendientes de asignación.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona Técnico
                </label>
                <select
                  value={selectedTecnico}
                  onChange={(e) => setSelectedTecnico(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona técnico --</option>
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.username} value={tecnico.username}>
                      {tecnico.firstName} {tecnico.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAsignarTecnico}
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Asignando..." : "Asignar Técnico"}
              </button>
            </div>
          </div>
        )}

        {activeView === "Responder Orden" && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Responder Orden</h2>

    {/* Selector de Orden */}
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selecciona Orden <span className="text-xs text-gray-500">(solo tus órdenes asignadas)</span>
      </label>
      <select
        value={selectedOrdenCierre}
        onChange={(e) => setSelectedOrdenCierre(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Selecciona orden --</option>
        {ordenesTecnico.map((orden) => (
          <option key={orden.id} value={orden.id}>
            {orden.id} — {orden.clienteNombre} {orden.clienteApellido || ""} ({orden.estado})
          </option>
        ))}
      </select>
      {ordenesTecnico.length === 0 && (
        <p className="mt-2 text-sm text-amber-600">No tienes órdenes asignadas.</p>
      )}
    </div>

    {/* Contenido si hay una orden seleccionada */}
    {selectedOrdenCierre && (
      <div className="space-y-6">

        {/* ───────────────── CONTENIDO PRINCIPAL (COLUMNAS) ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── COLUMNA IZQUIERDA: Cierre técnico ─── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
            {selectedDetalleId ? "Cierre Técnico del Servicio" : "Servicios de la Orden"}
            </h3>

          {!selectedDetalleId ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Doble click sobre el nombre de un servicio para abrir su cierre técnico.
              </p>

              {cierreDetalles.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Esta orden no tiene servicios cargados.
                </div>
              ) : (
                cierreDetalles.map((detalle) => {
                  const semaforo = getDetalleSemaforo(detalle);
                  return (
                    <div
                      key={detalle.id}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onDoubleClick={() => abrirFormularioDetalle(detalle)}
                            className="text-left font-medium text-blue-700 hover:text-blue-800 hover:underline"
                            title="Doble click para responder este servicio"
                          >
                            {detalle.servicioNombre || `Servicio ${detalle.regServicio || ""}`}
                          </button>
                          <p className="mt-1 text-xs text-gray-500">
                            #{detalle.regServicio || "-"} {detalle.servicioCodigo ? `· ${detalle.servicioCodigo}` : ""}
                          </p>
                          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                            {detalle.cierreTecnico?.trim() || "Sin respuesta técnica registrada."}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`h-3 w-3 rounded-full ${semaforo.dot}`} />
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${semaforo.badge}`}>
                            {semaforo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">
                  {detalleForm.servicioNombre || "Servicio"}
                </p>
                <p className="text-xs text-blue-700">
                  #{detalleForm.regServicio || "-"} {detalleForm.servicioCodigo ? `· ${detalleForm.servicioCodigo}` : ""}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cierre Técnico
                </label>
                <textarea
                  value={detalleForm.cierreTecnico}
                  onChange={(e) => handleDetalleFormChange("cierreTecnico", e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observaciones del Servicio
                </label>
                <textarea
                  value={detalleForm.observaciones}
                  onChange={(e) => handleDetalleFormChange("observaciones", e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  <input
                    type="checkbox"
                    checked={Boolean(detalleForm.diagnosticado)}
                    onChange={(e) => handleDetalleFormChange("diagnosticado", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  Diagnosticado
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  <input
                    type="checkbox"
                    checked={Boolean(detalleForm.reparado)}
                    onChange={(e) => handleDetalleFormChange("reparado", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Reparado
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGuardarServicioSeleccionado}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Guardar Servicio"}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormularioDetalle}
                  disabled={loading}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  Volver a la Lista
                </button>
              </div>
            </div>
          )}
        </div>

          {/* ─── COLUMNA DERECHA: Registrar Venta ─── */}
          <div className="space-y-4 border-l border-gray-200 pl-6">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
              Registrar Venta
            </h3>

            {!can('sales.create') ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Tu rol no tiene permiso para adjuntar ventas a esta orden.
              </div>
            ) : (
              <>

              {/* Datos del cliente (solo lectura, derivados de la orden) */}
              {(() => {
                const ord = ordenesTecnico.find((o) => o.id === selectedOrdenCierre);
                if (!ord) return null;
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Cliente de la orden</p>
                    <p className="font-medium text-gray-800">
                      {ord.clienteNombre} {ord.clienteApellido}
                    </p>
                    {ord.clienteTelefono && (
                      <p className="text-gray-600 text-xs">{ord.clienteTelefono}</p>
                    )}
                    <p className="text-gray-500 text-xs">
                      Doc: {ord.clienteId} ({ord.clienteTipoDocumentoId})
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Sede: {ord.nombreSede || ord.codigoSede}
                    </p>
                  </div>
                );
              })()}

              {/* Agregar producto */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Código de producto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ventaProductoBuscado}
                    onChange={(e) => setVentaProductoBuscado(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAgregarItemVenta(ventaProductoBuscado);
                      }
                      if (e.key === "F2") {
                        e.preventDefault();
                        setVentaProductFilter("");
                        setShowVentaProductSearch(true);
                      }
                    }}
                    placeholder="ID del producto (Enter para agregar)"
                    className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => { setVentaProductFilter(""); setShowVentaProductSearch(true); }}
                    className="h-9 px-3 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200"
                    title="F2 para buscar"
                  >
                    Buscar
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Enter agrega por ID · F2 o "Buscar" abre el buscador</p>
              </div>

              {/* Tabla de ítems a registrar */}
              {ventaItems.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Producto</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Cant.</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Precio</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Subtotal</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ventaItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 text-xs">{item.nombre}</td>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setVentaItems((prev) => prev.map((i, j) => j === idx ? { ...i, cantidad: val } : i));
                              }}
                              className="w-14 text-center text-xs border border-gray-300 rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precioUnitario}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setVentaItems((prev) => prev.map((i, j) => j === idx ? { ...i, precioUnitario: val } : i));
                              }}
                              className="w-20 text-right text-xs border border-gray-300 rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right text-xs font-medium">
                            ${(item.cantidad * Number(item.precioUnitario)).toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarItemVenta(idx)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Total:</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                          ${calcularTotalVenta().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No hay productos agregados</p>
              )}

              {/* Observaciones venta */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={ventaObservaciones}
                  onChange={(e) => setVentaObservaciones(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRegistrarVentaOrden}
                disabled={loading || ventaItems.length === 0}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Registrar Venta"}
              </button>
              </>
            )}
            {/* ───────────────── PANEL SUPERIOR: VENTAS DE LA ORDEN ───────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Ventas Asociadas a la Orden
            </h3>

            <div className="flex items-center gap-3">
              {loadingVentasOrden && (
                <span className="text-sm text-gray-500">Cargando ventas...</span>
              )}
              {selectedOrdenCierre && can('orders.pdf') && (
                <button
                  type="button"
                  onClick={() => handleDescargarOrdenPdf(selectedOrdenCierre)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  IMPRIMIR FACTURA
                </button>
              )}
            </div>
          </div>

          {!loadingVentasOrden && detallesVentasOrden.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Esta orden aún no tiene ventas registradas.
            </div>
          )}

          {detallesVentasOrden.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">
                      Cantidad
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">
                      Precio
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">
                      Subtotal
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {detallesVentasOrden.map((item, idx) => (
                    <tr key={`${item.ventaId}-${idx}`}>
                      <td className="px-3 py-2 text-gray-800">
                        {item.producto}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.cantidad}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${item.precio.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray-100 border-t border-gray-300">
                  <tr>
                    <td
                      colSpan="3"
                      className="px-3 py-3 text-right font-semibold text-gray-800"
                    >
                      TOTAL GENERAL
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-green-700">
                      ${totalGeneralVentasOrden.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {activeView === "ENTREGAR" && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Entregar Orden</h2>
            <p className="text-sm text-gray-500 mb-4">
              Solo se muestran órdenes cuyo estado es LISTA o REPARADA y que tienen todos sus servicios marcados como REPARADO.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden a Entregar
              </label>
              <select
                value={selectedOrdenEntregarId}
                onChange={(e) => setSelectedOrdenEntregarId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona una orden --</option>
                {ordenesParaEntregar.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.clienteNombre || o.nit || "-"} — {o.estado}
                  </option>
                ))}
              </select>
              {ordenesParaEntregar.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  No hay órdenes listas para entregar en este momento.
                </p>
              )}
            </div>

            <button
              onClick={handleEntregarOrden}
              disabled={loading || !selectedOrdenEntregarId}
              className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Confirmar Entrega"}
            </button>

            {selectedOrdenEntregarId && can('orders.pdf') && (
              <button
                type="button"
                onClick={() => handleDescargarOrdenPdf(selectedOrdenEntregarId)}
                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Descargar PDF de la Orden
              </button>
            )}
          </div>
        )}

        {showVentaProductSearch && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Buscar Producto</h3>
                <button
                  type="button"
                  onClick={() => setShowVentaProductSearch(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-4 border-b border-gray-100">
                <input
                  type="text"
                  autoFocus
                  value={ventaProductFilter}
                  onChange={(e) => setVentaProductFilter(e.target.value)}
                  placeholder="Filtrar por nombre o ID..."
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Precio</th>
                      <th className="px-4 py-2 text-center font-semibold text-gray-700">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productos
                      .filter((p) => {
                        const q = ventaProductFilter.toLowerCase();
                        const catId = p.categoryId || p.category?.id || "";
                        if (catId === "S" || p.activo === false) return false;
                        return (
                          !q ||
                          String(p.id).toLowerCase().includes(q) ||
                          (p.name || "").toLowerCase().includes(q)
                        );
                      })
                      .map((p) => (
                        <tr
                          key={p.id}
                          onDoubleClick={() => {
                            handleAgregarItemVenta(p.id);
                            setShowVentaProductSearch(false);
                          }}
                          className="hover:bg-blue-50 cursor-pointer"
                        >
                          <td className="px-4 py-2 text-xs text-gray-500">{p.id}</td>
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2 text-right">${Number(p.price || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">{p.quantity ?? "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
                Doble click para agregar el producto a la venta
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
                  Se encontraron varias coincidencias para el nit. Doble click para seleccionar.
                </p>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">NIT/Documento</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Tipo</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Nombre</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Telefono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientMatches.map((cliente) => (
                        <tr
                          key={`${cliente.nit}-${cliente.tipoDocumentoId || ""}`}
                          onDoubleClick={() => seleccionarCliente(cliente)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-2 text-sm text-gray-900">{cliente.nit}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {cliente.tipoDocumentoName || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </td>
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
      </div>
    </div>
  );
}
