const Joi = require('joi');
const logger = require('../utils/logger');

const clinicSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Nome da clínica deve ter pelo menos 2 caracteres',
      'string.max': 'Nome da clínica deve ter no máximo 255 caracteres',
      'any.required': 'Nome da clínica é obrigatório'
    }),
  type: Joi.string().valid('clinic', 'hospital', 'laboratory', 'imaging', 'pharmacy').required()
    .messages({
      'any.only': 'Tipo deve ser clinic, hospital, laboratory, imaging ou pharmacy',
      'any.required': 'Tipo da clínica é obrigatório'
    }),
  specialty: Joi.string().max(255).optional()
    .messages({
      'string.max': 'Especialidade deve ter no máximo 255 caracteres'
    }),
  description: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),
  mission: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Missão deve ter no máximo 500 caracteres'
    }),
  values: Joi.array().items(Joi.string().max(100)).max(10).optional()
    .messages({
      'array.max': 'Valores devem ter no máximo 10 itens',
      'string.max': 'Cada valor deve ter no máximo 100 caracteres'
    }),
  differentials: Joi.array().items(Joi.string().max(200)).max(20).optional()
    .messages({
      'array.max': 'Diferenciais devem ter no máximo 20 itens',
      'string.max': 'Cada diferencial deve ter no máximo 200 caracteres'
    }),
  whatsapp_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    .messages({
      'string.pattern.base': 'Telefone WhatsApp deve estar em formato válido',
      'any.required': 'Telefone WhatsApp é obrigatório'
    }),
  email: Joi.string().email().max(255).optional()
    .messages({
      'string.email': 'Email deve estar em formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),
  website: Joi.string().uri().max(255).optional()
    .messages({
      'string.uri': 'Website deve ser uma URL válida',
      'string.max': 'Website deve ter no máximo 255 caracteres'
    }),
  address: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Endereço deve ter no máximo 500 caracteres'
    }),
  city: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Cidade deve ter no máximo 100 caracteres'
    }),
  state: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Estado deve ter no máximo 100 caracteres'
    }),
  zip_code: Joi.string().max(20).optional()
    .messages({
      'string.max': 'CEP deve ter no máximo 20 caracteres'
    }),
  country: Joi.string().max(100).default('Brasil')
    .messages({
      'string.max': 'País deve ter no máximo 100 caracteres'
    }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    .messages({
      'string.pattern.base': 'Telefone deve estar em formato válido'
    }),
  working_hours: Joi.object().pattern(
    Joi.string().valid('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'),
    Joi.array().items(Joi.object({
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }))
  ).optional(),
  timezone: Joi.string().max(50).default('America/Sao_Paulo')
    .messages({
      'string.max': 'Fuso horário deve ter no máximo 50 caracteres'
    }),
  contextualization_json: Joi.object().optional(),
  ai_personality: Joi.object({
    name: Joi.string().max(100).required(),
    tone: Joi.string().valid('friendly', 'professional', 'casual', 'formal').required(),
    formality: Joi.string().valid('low', 'medium', 'high').required(),
    languages: Joi.array().items(Joi.string()).min(1).required(),
    greeting: Joi.string().max(500).required(),
    farewell: Joi.string().max(500).required(),
    out_of_hours: Joi.string().max(500).required()
  }).optional(),
  ai_behavior: Joi.object({
    proactivity: Joi.string().valid('low', 'medium', 'high').required(),
    suggestions: Joi.boolean().required(),
    feedback: Joi.boolean().required(),
    auto_escalation: Joi.boolean().required(),
    escalation_threshold: Joi.number().integer().min(1).max(10).required(),
    memory_enabled: Joi.boolean().required(),
    context_window: Joi.number().integer().min(1).max(50).required()
  }).optional(),
  appointment_policies: Joi.object({
    min_advance_notice: Joi.number().integer().min(0).max(168).required(),
    max_advance_notice: Joi.number().integer().min(1).max(365).required(),
    default_slot_duration: Joi.number().integer().min(15).max(480).required(),
    max_daily_appointments: Joi.number().integer().min(1).max(1000).required(),
    cancellation_policy: Joi.string().max(50).required(),
    rescheduling_policy: Joi.string().max(50).required()
  }).optional(),
  calendar_mappings: Joi.object().optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
    .messages({
      'any.only': 'Status deve ser active, inactive ou suspended'
    })
});

const professionalSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Nome do profissional deve ter pelo menos 2 caracteres',
      'string.max': 'Nome do profissional deve ter no máximo 255 caracteres',
      'any.required': 'Nome do profissional é obrigatório'
    }),
  crm: Joi.string().max(50).optional()
    .messages({
      'string.max': 'CRM deve ter no máximo 50 caracteres'
    }),
  specialties: Joi.array().items(Joi.string().max(100)).max(20).optional()
    .messages({
      'array.max': 'Especialidades devem ter no máximo 20 itens',
      'string.max': 'Cada especialidade deve ter no máximo 100 caracteres'
    }),
  experience_years: Joi.number().integer().min(0).max(50).optional()
    .messages({
      'number.min': 'Anos de experiência devem ser no mínimo 0',
      'number.max': 'Anos de experiência devem ser no máximo 50'
    }),
  bio: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Biografia deve ter no máximo 1000 caracteres'
    }),
  photo_url: Joi.string().uri().max(500).optional()
    .messages({
      'string.uri': 'URL da foto deve ser válida',
      'string.max': 'URL da foto deve ter no máximo 500 caracteres'
    }),
  accepts_new_patients: Joi.boolean().default(true),
  default_appointment_duration: Joi.number().integer().min(15).max(480).default(30)
    .messages({
      'number.min': 'Duração padrão deve ser no mínimo 15 minutos',
      'number.max': 'Duração padrão deve ser no máximo 480 minutos'
    }),
  working_hours: Joi.object().optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
    .messages({
      'any.only': 'Status deve ser active, inactive ou suspended'
    })
});

const serviceSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Nome do serviço deve ter pelo menos 2 caracteres',
      'string.max': 'Nome do serviço deve ter no máximo 255 caracteres',
      'any.required': 'Nome do serviço é obrigatório'
    }),
  description: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),
  category: Joi.string().valid('consultation', 'examination', 'procedure', 'therapy', 'surgery').required()
    .messages({
      'any.only': 'Categoria deve ser consultation, examination, procedure, therapy ou surgery',
      'any.required': 'Categoria do serviço é obrigatória'
    }),
  specialty: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Especialidade deve ter no máximo 100 caracteres'
    }),
  duration: Joi.number().integer().min(15).max(480).required()
    .messages({
      'number.min': 'Duração deve ser no mínimo 15 minutos',
      'number.max': 'Duração deve ser no máximo 480 minutos',
      'any.required': 'Duração do serviço é obrigatória'
    }),
  price: Joi.number().precision(2).min(0).max(999999.99).required()
    .messages({
      'number.min': 'Preço deve ser no mínimo 0',
      'number.max': 'Preço deve ser no máximo 999999.99',
      'any.required': 'Preço do serviço é obrigatório'
    }),
  currency: Joi.string().length(3).default('BRL')
    .messages({
      'string.length': 'Moeda deve ter exatamente 3 caracteres'
    }),
  accepts_insurance: Joi.boolean().default(false),
  insurance_providers: Joi.array().items(Joi.string().max(100)).max(50).optional()
    .messages({
      'array.max': 'Convênios devem ter no máximo 50 itens',
      'string.max': 'Cada convênio deve ter no máximo 100 caracteres'
    }),
  requires_referral: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
    .messages({
      'any.only': 'Status deve ser active, inactive ou suspended'
    })
});

const contextualizationSchema = Joi.object({
  clinic_info: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    specialty: Joi.string().optional(),
    description: Joi.string().optional(),
    mission: Joi.string().optional(),
    values: Joi.array().items(Joi.string()).optional(),
    differentials: Joi.array().items(Joi.string()).optional()
  }).required(),
  ai_personality: Joi.object({
    name: Joi.string().required(),
    tone: Joi.string().valid('friendly', 'professional', 'casual', 'formal').required(),
    formality: Joi.string().valid('low', 'medium', 'high').required(),
    languages: Joi.array().items(Joi.string()).min(1).required(),
    greeting: Joi.string().required(),
    farewell: Joi.string().required(),
    out_of_hours: Joi.string().required()
  }).required(),
  ai_behavior: Joi.object({
    proactivity: Joi.string().valid('low', 'medium', 'high').required(),
    suggestions: Joi.boolean().required(),
    feedback: Joi.boolean().required(),
    auto_escalation: Joi.boolean().required(),
    escalation_threshold: Joi.number().integer().min(1).max(10).required(),
    memory_enabled: Joi.boolean().required(),
    context_window: Joi.number().integer().min(1).max(50).required()
  }).required(),
  working_hours: Joi.object().required(),
  services: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    category: Joi.string().required(),
    duration: Joi.number().required(),
    price: Joi.number().required()
  })).required(),
  professionals: Joi.array().items(Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    specialties: Joi.array().items(Joi.string()).optional(),
    accepts_new_patients: Joi.boolean().required()
  })).required(),
  appointment_policies: Joi.object({
    min_advance_notice: Joi.number().required(),
    max_advance_notice: Joi.number().required(),
    default_slot_duration: Joi.number().required(),
    max_daily_appointments: Joi.number().required(),
    cancellation_policy: Joi.string().required(),
    rescheduling_policy: Joi.string().required()
  }).required(),
  calendar_mappings: Joi.object().optional(),
  fallbacks: Joi.object().optional()
});

const validateClinicData = (req, res, next) => {
  const { error, value } = clinicSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    logger.warn('Clinic data validation failed', { 
      errors: errors,
      requestId: req.id 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  req.validatedData = value;
  next();
};

const validateProfessionalData = (req, res, next) => {
  const { error, value } = professionalSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    logger.warn('Professional data validation failed', { 
      errors: errors,
      requestId: req.id 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  req.validatedData = value;
  next();
};

const validateServiceData = (req, res, next) => {
  const { error, value } = serviceSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    logger.warn('Service data validation failed', { 
      errors: errors,
      requestId: req.id 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  req.validatedData = value;
  next();
};

const validateContextualizationData = (req, res, next) => {
  const { error, value } = contextualizationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    logger.warn('Contextualization data validation failed', { 
      errors: errors,
      requestId: req.id 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  req.validatedData = value;
  next();
};

module.exports = {
  validateClinicData,
  validateProfessionalData,
  validateServiceData,
  validateContextualizationData,
  clinicSchema,
  professionalSchema,
  serviceSchema,
  contextualizationSchema
};
