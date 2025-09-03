import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  ExampleObjectSchema,
  MediaTypeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ExampleObject, MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import ExampleResponse from './ExampleResponse.vue'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

describe('ExampleResponse', () => {
  describe('basic rendering', () => {
    it('renders example when provided', () => {
      const example: ExampleObject = {
        value: { message: 'Hello, World!', status: 'success' },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toEqual({ message: 'Hello, World!', status: 'success' })
      expect(codeBlock.props('lang')).toBe('json')
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('renders example with summary and description', () => {
      const example = coerceValue(ExampleObjectSchema, {
        summary: 'Success response example',
        description: 'This is a successful API response',
        value: { id: 1, name: 'John Doe', email: 'john@example.com' },
      })

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      })
    })

    it('falls back to schema when no example is provided', () => {
      const response = coerceValue(MediaTypeObjectSchema, {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'number' },
          },
        },
      })

      const wrapper = mount(ExampleResponse, {
        props: {
          response,
          example: undefined,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('lang')).toBe('json')
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('renders empty state when no example or schema is provided', () => {
      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example: undefined as any,
        },
      })

      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No Body')
      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(false)
    })

    it('renders empty state when response has no schema', () => {
      const response: MediaTypeObject = {}

      const wrapper = mount(ExampleResponse, {
        props: {
          response,
          example: undefined,
        },
      })

      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No Body')
      expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(false)
    })
  })

  describe('$refValues handling', () => {
    it('resolves simple $refValues example like the provided payload', () => {
      const example = {
        $ref: '#/components/examples/RandomSpot',
        '$ref-value': {
          value: {
            summary: 'The best spot',
            value: {
              id: 'user-123',
              name: 'Alice Johnson',
              email: 'alice@company.com',
              profile: {
                $ref: '#/components/schemas/UserProfile',
                '$ref-value': {
                  department: 'Engineering',
                  role: 'Senior Developer',
                  permissions: ['read', 'write', 'admin'],
                  settings: {
                    notifications: true,
                    theme: 'dark',
                    language: 'en-US',
                  },
                },
              },
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          // @ts-expect-error - Testing a ref at the base
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      // The resolved value should be the $ref-value content
      const expectedContent = {
        summary: 'The best spot',
        value: {
          id: 'user-123',
          name: 'Alice Johnson',
          email: 'alice@company.com',
          profile: {
            department: 'Engineering',
            role: 'Senior Developer',
            permissions: ['read', 'write', 'admin'],
            settings: {
              notifications: true,
              theme: 'dark',
              language: 'en-US',
            },
          },
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves nested $refValues with user management payload', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/UserManagementExample',
          '$ref-value': {
            users: [
              {
                $ref: '#/components/schemas/User',
                '$ref-value': {
                  id: 'user-123',
                  name: 'Alice Johnson',
                  email: 'alice@company.com',
                  profile: {
                    $ref: '#/components/schemas/UserProfile',
                    '$ref-value': {
                      department: 'Engineering',
                      role: 'Senior Developer',
                      permissions: ['read', 'write', 'admin'],
                      settings: {
                        notifications: true,
                        theme: 'dark',
                        language: 'en-US',
                      },
                    },
                  },
                },
              },
              {
                $ref: '#/components/schemas/User',
                '$ref-value': {
                  id: 'user-456',
                  name: 'Bob Smith',
                  email: 'bob@company.com',
                  profile: {
                    $ref: '#/components/schemas/UserProfile',
                    '$ref-value': {
                      department: 'Product',
                      role: 'Product Manager',
                      permissions: ['read', 'write'],
                      settings: {
                        notifications: false,
                        theme: 'light',
                        language: 'en-US',
                      },
                    },
                  },
                },
              },
            ],
            metadata: {
              total: 2,
              page: 1,
              perPage: 10,
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        users: [
          {
            id: 'user-123',
            name: 'Alice Johnson',
            email: 'alice@company.com',
            profile: {
              department: 'Engineering',
              role: 'Senior Developer',
              permissions: ['read', 'write', 'admin'],
              settings: {
                notifications: true,
                theme: 'dark',
                language: 'en-US',
              },
            },
          },
          {
            id: 'user-456',
            name: 'Bob Smith',
            email: 'bob@company.com',
            profile: {
              department: 'Product',
              role: 'Product Manager',
              permissions: ['read', 'write'],
              settings: {
                notifications: false,
                theme: 'light',
                language: 'en-US',
              },
            },
          },
        ],
        metadata: {
          total: 2,
          page: 1,
          perPage: 10,
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves e-commerce order payload with $refValues', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/EcommerceOrder',
          '$ref-value': {
            orderId: 'order-789',
            customer: {
              $ref: '#/components/schemas/Customer',
              '$ref-value': {
                id: 'cust-456',
                name: 'Emily Davis',
                email: 'emily@example.com',
                address: {
                  $ref: '#/components/schemas/Address',
                  '$ref-value': {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94102',
                    country: 'USA',
                  },
                },
              },
            },
            items: [
              {
                $ref: '#/components/schemas/OrderItem',
                '$ref-value': {
                  productId: 'prod-123',
                  name: 'Wireless Headphones',
                  quantity: 2,
                  price: 99.99,
                  category: {
                    $ref: '#/components/schemas/Category',
                    '$ref-value': {
                      id: 'cat-electronics',
                      name: 'Electronics',
                      tags: ['audio', 'wireless', 'bluetooth'],
                    },
                  },
                },
              },
              {
                $ref: '#/components/schemas/OrderItem',
                '$ref-value': {
                  productId: 'prod-456',
                  name: 'USB Cable',
                  quantity: 1,
                  price: 12.99,
                  category: {
                    $ref: '#/components/schemas/Category',
                    '$ref-value': {
                      id: 'cat-accessories',
                      name: 'Accessories',
                      tags: ['cable', 'usb', 'connector'],
                    },
                  },
                },
              },
            ],
            payment: {
              $ref: '#/components/schemas/Payment',
              '$ref-value': {
                method: 'credit_card',
                amount: 212.97,
                currency: 'USD',
                status: 'completed',
                transactionId: 'txn-abc123',
              },
            },
            shipping: {
              method: 'standard',
              estimatedDelivery: '2024-01-15',
              trackingNumber: 'TRACK123456',
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        orderId: 'order-789',
        customer: {
          id: 'cust-456',
          name: 'Emily Davis',
          email: 'emily@example.com',
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
          },
        },
        items: [
          {
            productId: 'prod-123',
            name: 'Wireless Headphones',
            quantity: 2,
            price: 99.99,
            category: {
              id: 'cat-electronics',
              name: 'Electronics',
              tags: ['audio', 'wireless', 'bluetooth'],
            },
          },
          {
            productId: 'prod-456',
            name: 'USB Cable',
            quantity: 1,
            price: 12.99,
            category: {
              id: 'cat-accessories',
              name: 'Accessories',
              tags: ['cable', 'usb', 'connector'],
            },
          },
        ],
        payment: {
          method: 'credit_card',
          amount: 212.97,
          currency: 'USD',
          status: 'completed',
          transactionId: 'txn-abc123',
        },
        shipping: {
          method: 'standard',
          estimatedDelivery: '2024-01-15',
          trackingNumber: 'TRACK123456',
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves API analytics dashboard payload with $refValues', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/AnalyticsDashboard',
          '$ref-value': {
            timeRange: '7d',
            metrics: {
              $ref: '#/components/schemas/Metrics',
              '$ref-value': {
                totalRequests: 150420,
                successRate: 99.2,
                averageResponseTime: 45.3,
                errors: {
                  $ref: '#/components/schemas/ErrorBreakdown',
                  '$ref-value': {
                    total: 1203,
                    breakdown: [
                      { code: 400, count: 450, percentage: 37.4 },
                      { code: 401, count: 330, percentage: 27.4 },
                      { code: 404, count: 250, percentage: 20.8 },
                      { code: 500, count: 173, percentage: 14.4 },
                    ],
                  },
                },
              },
            },
            endpoints: [
              {
                $ref: '#/components/schemas/EndpointStats',
                '$ref-value': {
                  path: '/api/v1/users',
                  method: 'GET',
                  requests: 45680,
                  averageResponseTime: 32.1,
                  successRate: 99.8,
                  cacheHitRate: 85.3,
                },
              },
              {
                $ref: '#/components/schemas/EndpointStats',
                '$ref-value': {
                  path: '/api/v1/orders',
                  method: 'POST',
                  requests: 12340,
                  averageResponseTime: 78.5,
                  successRate: 98.1,
                  cacheHitRate: 0,
                },
              },
            ],
            geographicDistribution: {
              regions: [
                { name: 'North America', requests: 75210, percentage: 50.0 },
                { name: 'Europe', requests: 45126, percentage: 30.0 },
                { name: 'Asia Pacific', requests: 30084, percentage: 20.0 },
              ],
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        timeRange: '7d',
        metrics: {
          totalRequests: 150420,
          successRate: 99.2,
          averageResponseTime: 45.3,
          errors: {
            total: 1203,
            breakdown: [
              { code: 400, count: 450, percentage: 37.4 },
              { code: 401, count: 330, percentage: 27.4 },
              { code: 404, count: 250, percentage: 20.8 },
              { code: 500, count: 173, percentage: 14.4 },
            ],
          },
        },
        endpoints: [
          {
            path: '/api/v1/users',
            method: 'GET',
            requests: 45680,
            averageResponseTime: 32.1,
            successRate: 99.8,
            cacheHitRate: 85.3,
          },
          {
            path: '/api/v1/orders',
            method: 'POST',
            requests: 12340,
            averageResponseTime: 78.5,
            successRate: 98.1,
            cacheHitRate: 0,
          },
        ],
        geographicDistribution: {
          regions: [
            { name: 'North America', requests: 75210, percentage: 50.0 },
            { name: 'Europe', requests: 45126, percentage: 30.0 },
            { name: 'Asia Pacific', requests: 30084, percentage: 20.0 },
          ],
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves IoT device management payload with $refValues', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/IoTDeviceManager',
          '$ref-value': {
            deviceId: 'iot-device-7834',
            name: 'Smart Thermostat - Living Room',
            status: 'online',
            lastHeartbeat: '2024-01-10T15:30:00Z',
            telemetry: {
              $ref: '#/components/schemas/DeviceTelemetry',
              '$ref-value': {
                temperature: 22.5,
                humidity: 45.2,
                batteryLevel: 87,
                signalStrength: -45,
                firmwareVersion: '2.1.4',
                sensors: [
                  {
                    $ref: '#/components/schemas/Sensor',
                    '$ref-value': {
                      id: 'temp-sensor-01',
                      type: 'temperature',
                      value: 22.5,
                      unit: 'celsius',
                      accuracy: 0.1,
                      calibrationDate: '2023-12-01',
                    },
                  },
                  {
                    $ref: '#/components/schemas/Sensor',
                    '$ref-value': {
                      id: 'humid-sensor-01',
                      type: 'humidity',
                      value: 45.2,
                      unit: 'percent',
                      accuracy: 2.0,
                      calibrationDate: '2023-12-01',
                    },
                  },
                ],
              },
            },
            configuration: {
              $ref: '#/components/schemas/DeviceConfig',
              '$ref-value': {
                mode: 'auto',
                targetTemperature: 21.0,
                schedule: {
                  weekdays: [
                    { time: '06:00', temperature: 20.0 },
                    { time: '08:00', temperature: 18.0 },
                    { time: '18:00', temperature: 22.0 },
                    { time: '22:00', temperature: 19.0 },
                  ],
                  weekends: [
                    { time: '08:00', temperature: 21.0 },
                    { time: '23:00', temperature: 18.5 },
                  ],
                },
                energySaving: true,
                notifications: {
                  lowBattery: true,
                  offline: true,
                  temperatureAlert: false,
                },
              },
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        deviceId: 'iot-device-7834',
        name: 'Smart Thermostat - Living Room',
        status: 'online',
        lastHeartbeat: '2024-01-10T15:30:00Z',
        telemetry: {
          temperature: 22.5,
          humidity: 45.2,
          batteryLevel: 87,
          signalStrength: -45,
          firmwareVersion: '2.1.4',
          sensors: [
            {
              id: 'temp-sensor-01',
              type: 'temperature',
              value: 22.5,
              unit: 'celsius',
              accuracy: 0.1,
              calibrationDate: '2023-12-01',
            },
            {
              id: 'humid-sensor-01',
              type: 'humidity',
              value: 45.2,
              unit: 'percent',
              accuracy: 2.0,
              calibrationDate: '2023-12-01',
            },
          ],
        },
        configuration: {
          mode: 'auto',
          targetTemperature: 21.0,
          schedule: {
            weekdays: [
              { time: '06:00', temperature: 20.0 },
              { time: '08:00', temperature: 18.0 },
              { time: '18:00', temperature: 22.0 },
              { time: '22:00', temperature: 19.0 },
            ],
            weekends: [
              { time: '08:00', temperature: 21.0 },
              { time: '23:00', temperature: 18.5 },
            ],
          },
          energySaving: true,
          notifications: {
            lowBattery: true,
            offline: true,
            temperatureAlert: false,
          },
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves financial transaction payload with $refValues', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/FinancialTransaction',
          '$ref-value': {
            transactionId: 'txn-fin-90834',
            type: 'transfer',
            amount: 2500.75,
            currency: 'USD',
            timestamp: '2024-01-10T14:25:33Z',
            sender: {
              $ref: '#/components/schemas/Account',
              '$ref-value': {
                accountId: 'acc-sender-123',
                accountNumber: '****1234',
                holderName: 'Sarah Mitchell',
                bankCode: 'BANK001',
                branch: 'Downtown Branch',
                accountType: 'checking',
                balance: 15420.3,
              },
            },
            recipient: {
              $ref: '#/components/schemas/Account',
              '$ref-value': {
                accountId: 'acc-recipient-456',
                accountNumber: '****5678',
                holderName: 'Tech Solutions LLC',
                bankCode: 'BANK002',
                branch: 'Business Center',
                accountType: 'business',
                balance: 87340.15,
              },
            },
            fees: {
              $ref: '#/components/schemas/TransactionFees',
              '$ref-value': {
                processingFee: 5.0,
                wireFee: 25.0,
                foreignExchangeFee: 0.0,
                total: 30.0,
                currency: 'USD',
              },
            },
            authorization: {
              method: 'two_factor',
              code: 'AUTH-789012',
              verifiedBy: 'mobile_app',
              timestamp: '2024-01-10T14:24:15Z',
            },
            riskAssessment: {
              score: 92,
              level: 'low',
              factors: ['verified_account', 'regular_transaction', 'known_recipient'],
              flagged: false,
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        transactionId: 'txn-fin-90834',
        type: 'transfer',
        amount: 2500.75,
        currency: 'USD',
        timestamp: '2024-01-10T14:25:33Z',
        sender: {
          accountId: 'acc-sender-123',
          accountNumber: '****1234',
          holderName: 'Sarah Mitchell',
          bankCode: 'BANK001',
          branch: 'Downtown Branch',
          accountType: 'checking',
          balance: 15420.3,
        },
        recipient: {
          accountId: 'acc-recipient-456',
          accountNumber: '****5678',
          holderName: 'Tech Solutions LLC',
          bankCode: 'BANK002',
          branch: 'Business Center',
          accountType: 'business',
          balance: 87340.15,
        },
        fees: {
          processingFee: 5.0,
          wireFee: 25.0,
          foreignExchangeFee: 0.0,
          total: 30.0,
          currency: 'USD',
        },
        authorization: {
          method: 'two_factor',
          code: 'AUTH-789012',
          verifiedBy: 'mobile_app',
          timestamp: '2024-01-10T14:24:15Z',
        },
        riskAssessment: {
          score: 92,
          level: 'low',
          factors: ['verified_account', 'regular_transaction', 'known_recipient'],
          flagged: false,
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('resolves healthcare patient record with $refValues', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/PatientRecord',
          '$ref-value': {
            patientId: 'patient-uuid-7890',
            mrn: 'MRN-20240110-001',
            demographics: {
              $ref: '#/components/schemas/PatientDemographics',
              '$ref-value': {
                firstName: 'Alexandra',
                lastName: 'Rodriguez',
                dateOfBirth: '1985-03-15',
                gender: 'female',
                ssn: '***-**-4567',
                address: {
                  street: '456 Healthcare Ave',
                  city: 'Medical City',
                  state: 'TX',
                  zipCode: '75230',
                  country: 'USA',
                },
                contact: {
                  primaryPhone: '555-0123',
                  email: 'alexandra.rodriguez@email.com',
                  emergencyContact: {
                    name: 'Carlos Rodriguez',
                    relationship: 'spouse',
                    phone: '555-0124',
                  },
                },
              },
            },
            insurance: {
              $ref: '#/components/schemas/InsuranceInfo',
              '$ref-value': {
                primary: {
                  carrier: 'HealthFirst Insurance',
                  policyNumber: 'HF-789012345',
                  groupNumber: 'GRP-456789',
                  subscriberId: 'SUB-123456',
                  effectiveDate: '2024-01-01',
                  expirationDate: '2024-12-31',
                  copay: 25.0,
                  deductible: 1500.0,
                  deductibleMet: 450.0,
                },
                secondary: null,
              },
            },
            medicalHistory: {
              conditions: [
                {
                  $ref: '#/components/schemas/MedicalCondition',
                  '$ref-value': {
                    code: 'ICD10-E11.9',
                    description: 'Type 2 diabetes mellitus without complications',
                    diagnosisDate: '2020-06-15',
                    status: 'active',
                    severity: 'moderate',
                  },
                },
                {
                  $ref: '#/components/schemas/MedicalCondition',
                  '$ref-value': {
                    code: 'ICD10-I10',
                    description: 'Essential hypertension',
                    diagnosisDate: '2019-11-02',
                    status: 'active',
                    severity: 'mild',
                  },
                },
              ],
              allergies: ['penicillin', 'shellfish'],
              medications: [
                {
                  name: 'Metformin',
                  dosage: '500mg',
                  frequency: 'twice daily',
                  prescribedDate: '2020-06-15',
                  prescribingPhysician: 'Dr. Smith',
                },
                {
                  name: 'Lisinopril',
                  dosage: '10mg',
                  frequency: 'once daily',
                  prescribedDate: '2019-11-02',
                  prescribingPhysician: 'Dr. Johnson',
                },
              ],
            },
            lastVisit: {
              date: '2024-01-05',
              provider: 'Dr. Sarah Kim, MD',
              department: 'Endocrinology',
              reason: 'Routine diabetes follow-up',
              vitals: {
                bloodPressure: '128/82',
                heartRate: 72,
                temperature: 98.6,
                weight: 165.2,
                height: 64,
                bmi: 28.3,
              },
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        patientId: 'patient-uuid-7890',
        mrn: 'MRN-20240110-001',
        demographics: {
          firstName: 'Alexandra',
          lastName: 'Rodriguez',
          dateOfBirth: '1985-03-15',
          gender: 'female',
          ssn: '***-**-4567',
          address: {
            street: '456 Healthcare Ave',
            city: 'Medical City',
            state: 'TX',
            zipCode: '75230',
            country: 'USA',
          },
          contact: {
            primaryPhone: '555-0123',
            email: 'alexandra.rodriguez@email.com',
            emergencyContact: {
              name: 'Carlos Rodriguez',
              relationship: 'spouse',
              phone: '555-0124',
            },
          },
        },
        insurance: {
          primary: {
            carrier: 'HealthFirst Insurance',
            policyNumber: 'HF-789012345',
            groupNumber: 'GRP-456789',
            subscriberId: 'SUB-123456',
            effectiveDate: '2024-01-01',
            expirationDate: '2024-12-31',
            copay: 25.0,
            deductible: 1500.0,
            deductibleMet: 450.0,
          },
          secondary: null,
        },
        medicalHistory: {
          conditions: [
            {
              code: 'ICD10-E11.9',
              description: 'Type 2 diabetes mellitus without complications',
              diagnosisDate: '2020-06-15',
              status: 'active',
              severity: 'moderate',
            },
            {
              code: 'ICD10-I10',
              description: 'Essential hypertension',
              diagnosisDate: '2019-11-02',
              status: 'active',
              severity: 'mild',
            },
          ],
          allergies: ['penicillin', 'shellfish'],
          medications: [
            {
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'twice daily',
              prescribedDate: '2020-06-15',
              prescribingPhysician: 'Dr. Smith',
            },
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'once daily',
              prescribedDate: '2019-11-02',
              prescribingPhysician: 'Dr. Johnson',
            },
          ],
        },
        lastVisit: {
          date: '2024-01-05',
          provider: 'Dr. Sarah Kim, MD',
          department: 'Endocrinology',
          reason: 'Routine diabetes follow-up',
          vitals: {
            bloodPressure: '128/82',
            heartRate: 72,
            temperature: 98.6,
            weight: 165.2,
            height: 64,
            bmi: 28.3,
          },
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })
  })

  describe('edge cases', () => {
    it('handles example with null value', () => {
      const example: ExampleObject = {
        value: null,
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toBe(null)
    })

    it('handles example with undefined value', () => {
      const example: ExampleObject = {
        value: undefined,
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toBe(undefined)
    })

    it('handles example with empty object', () => {
      const example: ExampleObject = {
        value: {},
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toEqual({})
    })

    it('handles example with empty array', () => {
      const example: ExampleObject = {
        value: [],
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toEqual([])
    })

    it('handles example with primitive values', () => {
      const examples = [{ value: 'string value' }, { value: 42 }, { value: true }, { value: false }]

      examples.forEach((example) => {
        const wrapper = mount(ExampleResponse, {
          props: {
            response: undefined,
            example,
          },
        })

        const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
        expect(codeBlock.exists()).toBe(true)
        expect(codeBlock.props('content')).toBe(example.value)
      })
    })

    it('handles $refValues with missing $ref-value', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/MissingExample',
          // Missing '$ref-value'
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      // Should resolve to undefined when $ref-value is missing
      expect(codeBlock.props('content')).toBeUndefined()
    })

    it('handles $refValues with null $ref-value', () => {
      const example: ExampleObject = {
        value: {
          $ref: '#/components/examples/NullExample',
          '$ref-value': null,
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toBe(null)
    })

    it('handles circular references in $refValues gracefully', () => {
      // Create a structure that would cause infinite loops if not handled properly
      const circularRef: any = {
        $ref: '#/components/schemas/CircularNode',
        '$ref-value': {
          id: 'node-1',
          name: 'Root Node',
          children: [],
        },
      }

      // Add circular reference
      circularRef['$ref-value'].children = [circularRef]

      const example: ExampleObject = {
        value: circularRef,
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      // Should handle circular reference gracefully
      const content = codeBlock.props('content')
      expect(content).toBeDefined()
      expect(content.id).toBe('node-1')
      expect(content.name).toBe('Root Node')
      expect(Array.isArray(content.children)).toBe(true)
      // Circular reference should be marked as '[circular]'
      expect(content.children[0]).toBe('[circular]')
    })
  })

  describe('mixed data types with $refValues', () => {
    it('handles mixed primitive and reference types', () => {
      const example: ExampleObject = {
        value: {
          stringValue: 'Hello World',
          numberValue: 3.14159,
          booleanValue: true,
          nullValue: null,
          arrayValue: ['item1', 'item2', 'item3'],
          refValue: {
            $ref: '#/components/schemas/MixedConfig',
            '$ref-value': {
              enabled: true,
              maxRetries: 5,
              timeout: 30000,
              features: ['auth', 'cache', 'compression'],
              nested: {
                $ref: '#/components/schemas/NestedConfig',
                '$ref-value': {
                  debug: false,
                  logLevel: 'info',
                  endpoints: {
                    primary: 'https://api.example.com',
                    fallback: 'https://backup.example.com',
                  },
                },
              },
            },
          },
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        stringValue: 'Hello World',
        numberValue: 3.14159,
        booleanValue: true,
        nullValue: null,
        arrayValue: ['item1', 'item2', 'item3'],
        refValue: {
          enabled: true,
          maxRetries: 5,
          timeout: 30000,
          features: ['auth', 'cache', 'compression'],
          nested: {
            debug: false,
            logLevel: 'info',
            endpoints: {
              primary: 'https://api.example.com',
              fallback: 'https://backup.example.com',
            },
          },
        },
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })

    it('handles arrays containing $refValues', () => {
      const example: ExampleObject = {
        value: {
          tasks: [
            {
              $ref: '#/components/schemas/Task',
              '$ref-value': {
                id: 'task-1',
                title: 'Review Pull Request',
                priority: 'high',
                assignee: {
                  $ref: '#/components/schemas/User',
                  '$ref-value': {
                    id: 'user-123',
                    name: 'Jane Developer',
                    role: 'Senior Engineer',
                  },
                },
              },
            },
            {
              id: 'task-2',
              title: 'Write Documentation',
              priority: 'medium',
              assignee: null,
            },
            {
              $ref: '#/components/schemas/Task',
              '$ref-value': {
                id: 'task-3',
                title: 'Fix Bug #456',
                priority: 'low',
                assignee: {
                  $ref: '#/components/schemas/User',
                  '$ref-value': {
                    id: 'user-456',
                    name: 'Bob Tester',
                    role: 'QA Engineer',
                  },
                },
              },
            },
          ],
        },
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)

      const expectedContent = {
        tasks: [
          {
            id: 'task-1',
            title: 'Review Pull Request',
            priority: 'high',
            assignee: {
              id: 'user-123',
              name: 'Jane Developer',
              role: 'Senior Engineer',
            },
          },
          {
            id: 'task-2',
            title: 'Write Documentation',
            priority: 'medium',
            assignee: null,
          },
          {
            id: 'task-3',
            title: 'Fix Bug #456',
            priority: 'low',
            assignee: {
              id: 'user-456',
              name: 'Bob Tester',
              role: 'QA Engineer',
            },
          },
        ],
      }

      expect(codeBlock.props('content')).toEqual(expectedContent)
    })
  })

  describe('external value handling', () => {
    it('handles externalValue in example object', () => {
      const example: ExampleObject = {
        summary: 'External example',
        description: 'This example is loaded from an external URL',
        externalValue: 'https://example.com/api/example.json',
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      // When only externalValue is provided (no value), should resolve to undefined
      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toBeUndefined()
    })

    it('prefers value over externalValue when both are provided', () => {
      const example: ExampleObject = {
        summary: 'Mixed example',
        value: { message: 'Inline value' },
        externalValue: 'https://example.com/api/example.json',
      }

      const wrapper = mount(ExampleResponse, {
        props: {
          response: undefined,
          example,
        },
      })

      const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
      expect(codeBlock.exists()).toBe(true)
      expect(codeBlock.props('content')).toEqual({ message: 'Inline value' })
    })
  })
})
