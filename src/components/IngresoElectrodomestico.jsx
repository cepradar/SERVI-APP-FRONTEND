import React, { useState, useEffect } from 'react';
import api from './utils/axiosConfig.jsx';
import { CheckCircleIcon, PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function IngresoElectrodomestico() {
  const [activeTab, setActiveTab] = useState(1);
  const [electrodomesticoCreado, setElectrodomesticoCreado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [procesoFinalizado, setProcesoFinalizado] = useState(false);

  const tiposElectrodomestico = [
    { id: 'TV', name: 'Televisor' },
    { id: 'REFRIGERADOR', name: 'Refrigerador' },
    { id: 'LAVADORA', name: 'Lavadora' },
    { id: 'SECADORA', name: 'Secadora' },
    { id: 'MICROONDAS', name: 'Microondas' },
    { id: 'AIRE_ACONDICIONADO', name: 'Aire Acondicionado' },
    { id: 'ESTUFA', name: 'Estufa' },
    { id: 'HORNO', name: 'Horno' },
    { id: 'OTRO', name: 'Otro' }
  ];
  
  // Estado formulario electrodoméstico
  const [formElectro, setFormElectro] = useState({
    tipoDocumentoId: 'CC',
    documentoCliente: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    descripcionProblema: '',
    tipoElectrodomestico: '',
    marcaElectrodomesticoId: ''
  });

  // Estado formulario producto
  const [formProducto, setFormProducto] = useState({
    productoId: '',
    tecnicopUsername: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!formElectro.documentoCliente.trim()) {
      setClienteEncontrado(null);
      return;
    }

    const encontrado = clientes.find(
      (c) =>
        String(c.documento) === String(formElectro.documentoCliente).trim() &&
        c.tipoDocumentoId === formElectro.tipoDocumentoId
    );

    setClienteEncontrado(encontrado || null);
  }, [clientes, formElectro.documentoCliente, formElectro.tipoDocumentoId]);

  const cargarDatos = async () => {
    try {
      const [clientesRes, productosRes, tecnicosRes, marcasRes] = await Promise.all([
        api.get('/api/clientes/listar'),
        api.get('/api/products/listar'),
        api.get('/api/users/technicians'),
        api.get('/api/marcas-electrodomestico/listar')
      ]);
      
      setClientes(clientesRes.data || []);
      setProductos(productosRes.data || []);
      setTecnicos(tecnicosRes.data || []);
      setMarcas(marcasRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const handleChangeElectro = (e) => {
    const { name, value } = e.target;
    setFormElectro(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeProducto = (e) => {
    const { name, value } = e.target;
    setFormProducto(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitElectrodomestico = async (e) => {
    e.preventDefault();
    
    if (!formElectro.documentoCliente.trim()) {
      alert('Debe ingresar el documento del cliente');
      return;
    }

    if (!formElectro.numeroSerie.trim()) {
      alert('Debe ingresar el número de serie del electrodoméstico');
      return;
    }

    if (!clienteEncontrado) {
      alert('Cliente no encontrado. Verifique el tipo y número de documento.');
      return;
    }

    if (!formElectro.marcaElectrodomesticoId) {
      alert('Debe seleccionar una marca');
      return;
    }

    // NO hacer POST aquí - solo validar y guardar en memoria
    // El POST se hará cuando se clickee "Finalizar Proceso"
    const electrodomesticoTemporal = {
      clienteId: clienteEncontrado.documento, // ✅ Usar documento como ID, no id
      clienteTipoDocumentoId: clienteEncontrado.tipoDocumentoId,
      clienteNombre: clienteEncontrado.nombre || clienteEncontrado.documento,
      numeroSerie: formElectro.numeroSerie,
      marcaElectrodomesticoId: parseInt(formElectro.marcaElectrodomesticoId), // ✅ Asegurar que sea number
      marcaNombre: marcas.find(m => m.id === parseInt(formElectro.marcaElectrodomesticoId))?.nombre || '',
      descripcionProblema: formElectro.descripcionProblema || '',
      tipoElectrodomestico: formElectro.tipoElectrodomestico || '',
      modelo: formElectro.modelo || ''
    };

    setElectrodomesticoCreado(electrodomesticoTemporal);
    alert('Datos del electrodoméstico validados. Proceda a agregar productos/servicios.');
    setActiveTab(2);
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();

    if (!formProducto.productoId) {
      alert('Debe seleccionar un producto/servicio');
      return;
    }

    const producto = productos.find(p => String(p.id) === String(formProducto.productoId));
    if (!producto) {
      alert('Producto no encontrado');
      return;
    }

    // Si es de categoría SERVICIO, se requiere técnico
    if (producto.category && producto.category.id === 'SERVICIO' && !formProducto.tecnicopUsername) {
      alert('Debe asignar un técnico para servicios');
      return;
    }

    const productoAgregado = {
      id: Math.random(), // ID temporal
      productoId: formProducto.productoId,
      productoNombre: producto.name,
      productoCategoria: producto.category?.id,
      productoPrecio: producto.price,
      tecnicoAsignadoUsername: formProducto.tecnicopUsername || null,
      tecnicoAsignadoNombre: formProducto.tecnicopUsername ? 
        (tecnicos.find(t => t.username === formProducto.tecnicopUsername)?.firstName + ' ' + 
         tecnicos.find(t => t.username === formProducto.tecnicopUsername)?.lastName) : null,
      observaciones: formProducto.observaciones
    };

    setProductosSeleccionados([...productosSeleccionados, productoAgregado]);

    // Limpiar formulario
    setFormProducto({
      productoId: '',
      tecnicopUsername: '',
      observaciones: ''
    });
  };

  const handleEliminarProducto = (idTemporal) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== idTemporal));
  };

  const handleFinalizarProceso = async (e) => {
    e.preventDefault();

    if (!electrodomesticoCreado) {
      alert('Error: No hay electrodoméstico registrado');
      return;
    }

    if (productosSeleccionados.length === 0) {
      alert('Debe agregar al menos un producto/servicio');
      return;
    }

    try {
      let electrodomesticoGuardado = electrodomesticoCreado;

      // Primero guardar el electrodoméstico si es un objeto temporal (no tiene ID numérico)
      if (!electrodomesticoGuardado.id || isNaN(electrodomesticoGuardado.id)) {
        const payloadElectro = {
          clienteId: electrodomesticoGuardado.clienteId,
          clienteTipoDocumentoId: electrodomesticoGuardado.clienteTipoDocumentoId,
          numeroSerie: electrodomesticoGuardado.numeroSerie,
          marcaElectrodomesticoId: electrodomesticoGuardado.marcaElectrodomesticoId,
          electrodomesticoTipo: electrodomesticoGuardado.tipoElectrodomestico || '',
          electrodomesticoModelo: electrodomesticoGuardado.modelo || '',
          electrodomesticoId: null // No requerido
        };

        const resElectro = await api.post('/api/cliente-electrodomestico/registrar', payloadElectro);
        electrodomesticoGuardado = resElectro.data;
      }

      // Luego guardar un servicio con todos los productos relacionados
      if (productosSeleccionados.length > 0) {
        const productosPayload = productosSeleccionados.map(p => ({
          productId: p.productoId,
          cantidad: p.cantidad || 1,
          precioUnitario: p.productoPrecio || 0
        }));

        const payloadServicio = {
          clienteId: electrodomesticoGuardado.clienteId,
          clienteTipoDocumentoId: electrodomesticoGuardado.clienteTipoDocumentoId,
          electrodomesticoId: electrodomesticoGuardado.id,
          tipoServicio: 'REPARACION',
          descripcionProblema: 'Servicio técnico con productos',
          diagnostico: '',
          solucion: '',
          partesCambiadas: '',
          costoServicio: 0,
          costoRepuestos: 0,
          garantiaServicio: 30,
          observaciones: 'Servicios y productos agregados',
          tecnicoAsignadoUsername: productosSeleccionados[0]?.tecnicoAsignadoUsername || null,
          productos: productosPayload
        };

        await api.post('/api/servicios-reparacion/registrar', payloadServicio);
      }

      setProcesoFinalizado(true);
      alert('Proceso completado exitosamente');
      
      // Resetear formularios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error al finalizar proceso:', err);
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ingreso de Electrodoméstico y Servicios</h1>
        {!procesoFinalizado && (
          <button
            type="reset"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Ingreso
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab(1)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 1
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            1. Datos del Electrodoméstico
            {electrodomesticoCreado && <CheckCircleIcon className="inline h-5 w-5 ml-2 text-green-500" />}
          </button>
          
          <button
            onClick={() => electrodomesticoCreado && setActiveTab(2)}
            disabled={!electrodomesticoCreado}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 2
                ? 'border-blue-500 text-blue-600'
                : electrodomesticoCreado
                ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                : 'border-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            2. Agregar Productos/Servicios
            {productosSeleccionados.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {productosSeleccionados.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Contenido Tab 1: Electrodoméstico */}
      {activeTab === 1 && !procesoFinalizado && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Información del Electrodoméstico</h3>
          
          <form onSubmit={handleSubmitElectrodomestico} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipoDocumentoId"
                  value={formElectro.tipoDocumentoId}
                  onChange={handleChangeElectro}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>

              {/* Documento Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="documentoCliente"
                  value={formElectro.documentoCliente}
                  onChange={handleChangeElectro}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1234567890"
                />
                {clienteEncontrado && (
                  <p className="text-sm text-green-600 mt-1">✓ {clienteEncontrado.nombre}</p>
                )}
              </div>

              {/* Tipo Electrodoméstico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Electrodoméstico
                </label>
                <select
                  name="tipoElectrodomestico"
                  value={formElectro.tipoElectrodomestico}
                  onChange={handleChangeElectro}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {tiposElectrodomestico.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                  ))}
                </select>
              </div>

              {/* Marca Electrodoméstico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca <span className="text-red-500">*</span>
                </label>
                <select
                  name="marcaElectrodomesticoId"
                  value={formElectro.marcaElectrodomesticoId}
                  onChange={handleChangeElectro}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar marca...</option>
                  {marcas.map(marca => (
                    <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={formElectro.modelo}
                  onChange={handleChangeElectro}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: XYZ-123"
                />
              </div>

              {/* Número de Serie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Serie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="numeroSerie"
                  value={formElectro.numeroSerie}
                  onChange={handleChangeElectro}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: SN123456789"
                />
              </div>

              {/* Descripción del Problema */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Problema
                </label>
                <textarea
                  name="descripcionProblema"
                  value={formElectro.descripcionProblema}
                  onChange={handleChangeElectro}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describa el problema..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Registrar Electrodoméstico
              </button>
            </div>

            {electrodomesticoCreado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircleIcon className="h-6 w-6" />
                  <span className="font-medium">Electrodoméstico registrado exitosamente</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  ID: {electrodomesticoCreado.id} | Puede proceder a agregar productos/servicios en la siguiente pestaña
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Contenido Tab 2: Productos/Servicios */}
      {activeTab === 2 && electrodomesticoCreado && !procesoFinalizado && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Agregar Productos y Servicios</h3>
          
          {/* Info del electrodoméstico */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Electrodoméstico ID:</strong> {electrodomesticoCreado.id}
              {' '}| <strong>Cliente:</strong> {formElectro.documentoCliente}
            </p>
          </div>

          {/* Formulario agregar producto */}
          <form onSubmit={handleAgregarProducto} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700">Seleccionar Producto/Servicio</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Producto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto/Servicio <span className="text-red-500">*</span>
                </label>
                <select
                  name="productoId"
                  value={formProducto.productoId}
                  onChange={handleChangeProducto}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} - {prod.category?.name || 'Sin categoría'} (${prod.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-6"
                >
                  <PlusIcon className="inline h-5 w-5 mr-1" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Técnico - Solo aparece si se selecciona SERVICIO */}
            {formProducto.productoId && productos.find(p => String(p.id) === String(formProducto.productoId))?.category?.id === 'SERVICIO' && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-orange-600">
                  ⚠️ Este es un SERVICIO - Debe asignar un técnico <span className="text-red-500">*</span>
                </label>
                <select
                  name="tecnicopUsername"
                  value={formProducto.tecnicopUsername}
                  onChange={handleChangeProducto}
                  required
                  className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50"
                >
                  <option value="">Seleccionar técnico...</option>
                  {tecnicos.map(tech => (
                    <option key={tech.username} value={tech.username}>
                      {tech.firstName} {tech.lastName} ({tech.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones (Opcional)
              </label>
              <textarea
                name="observaciones"
                value={formProducto.observaciones}
                onChange={handleChangeProducto}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </form>

          {/* Lista de productos agregados */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-700 mb-3">Productos/Servicios Seleccionados ({productosSeleccionados.length})</h4>
            
            {productosSeleccionados.length === 0 ? (
              <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
                <p>No hay productos/servicios seleccionados. Agregue al menos uno.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {productosSeleccionados.map(prod => (
                  <div key={prod.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{prod.productoNombre}</p>
                      <p className="text-sm text-gray-600">
                        Categoría: <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          prod.productoCategoria === 'SERVICIO' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>{prod.productoCategoria}</span>
                      </p>
                      <p className="text-sm text-gray-600">Precio: ${prod.productoPrecio}</p>
                      {prod.tecnicoAsignadoNombre && (
                        <p className="text-sm text-green-600 font-semibold">
                          👨‍🔧 Técnico: {prod.tecnicoAsignadoNombre}
                        </p>
                      )}
                      {prod.observaciones && (
                        <p className="text-sm text-gray-500 italic">Obs: {prod.observaciones}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEliminarProducto(prod.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón Finalizar */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setActiveTab(1)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
            >
              Atrás
            </button>
            <button
              onClick={handleFinalizarProceso}
              disabled={productosSeleccionados.length === 0}
              className={`px-6 py-2 rounded-lg font-medium text-white ${
                productosSeleccionados.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              ✓ Finalizar Proceso
            </button>
          </div>
        </div>
      )}

      {/* Mensaje de finalización */}
      {procesoFinalizado && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">¡Proceso Completado!</h3>
          <p className="text-gray-600 mb-4">El electrodoméstico y todos los servicios han sido registrados exitosamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <PlusIcon className="inline h-5 w-5 mr-2" />
            Nuevo Ingreso
          </button>
        </div>
      )}
    </div>
  );
}
