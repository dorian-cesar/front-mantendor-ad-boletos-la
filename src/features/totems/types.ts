export interface TotemVideo {
  id: string | number;
  orden?: number;
  video_id?: string | number;
  [key: string]: any;
}

export interface Totem {
  id: string | number;
  identificador?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  status?: boolean | string;
  is_online?: boolean;
  ultimo_login?: string;
  ultima_telemetria?: any;
  ultimo_error_critico?: string;
  revenue?: number;
  sales?: number;
  total_transacciones?: number;
  boletos_vendidos?: number;
  block_screen_saver?: boolean;
  playlist?: TotemVideo[];
  videos?: TotemVideo[];
  video_ids?: (string | number)[];
  empresa_ids?: (string | number)[];
  empresas?: any[];
  [key: string]: any;
}

export interface ResumenGlobal {
  total_transacciones: number;
  boletos_vendidos: number;
  [key: string]: any;
}

export interface TotemForm {
  id?: string;
  identificador: string;
  direccion: string;
  latitud: number;
  longitud: number;
  status?: string | boolean;
  video_ids: string[];
  empresa_ids: string[];
}

export interface UseTotemsOptions {
  onTotemConnect?: (totem: Totem, tId: string) => void;
  onTotemDisconnect?: (totem: Totem, tId: string) => void;
}
