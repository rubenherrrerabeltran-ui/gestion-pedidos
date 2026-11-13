-- Esquema inicial del Sistema de Gestión de Pedidos (MySQL)
CREATE TABLE usuario (
  id_usuario    INT AUTO_INCREMENT PRIMARY KEY,
  documento     VARCHAR(12)  NOT NULL UNIQUE,
  nombres       VARCHAR(60)  NOT NULL,
  apellidos     VARCHAR(60)  NOT NULL,
  correo        VARCHAR(100) NOT NULL UNIQUE,
  clave_hash    VARCHAR(255) NOT NULL,
  rol           ENUM('ADMINISTRADOR','VENDEDOR','CLIENTE') NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE producto (
  id_producto   VARCHAR(7)   PRIMARY KEY,
  nombre        VARCHAR(60)  NOT NULL,
  categoria     VARCHAR(40)  NOT NULL,
  precio        DECIMAL(12,2) NOT NULL CHECK (precio > 0),
  existencias   INT NOT NULL CHECK (existencias >= 0),
  activo        BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE pedido (
  id_pedido     VARCHAR(8)   PRIMARY KEY,
  id_cliente    INT NOT NULL,
  fecha         DATETIME NOT NULL,
  estado        ENUM('REGISTRADO','EN_PREPARACION','DESPACHADO','ENTREGADO','CANCELADO') NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario)
);
CREATE TABLE detalle_pedido (
  id_pedido     VARCHAR(8) NOT NULL,
  id_producto   VARCHAR(7) NOT NULL,
  cantidad      INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id_pedido, id_producto),
  FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);
