import Schema from './Schema.vue'

export const stringSchema = {
  component: Schema,
  noncollapsible: true,
  props: {
    name: 'CustomString',
    noncollapsible: true,
    value: {
      type: 'string',
      example: 'Hello, world!',
    },
  },
}

export const objectSchema = {
  component: Schema,
  noncollapsible: true,
  props: {
    name: 'CustomObject',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        age: {
          type: 'number',
          example: 30,
        },
      },
    },
  },
}

const objectWithCircularReference = {
  type: 'object',
  properties: {
    circularReference: {},
  },
}

objectWithCircularReference.properties.circularReference = objectWithCircularReference

export const recursiveSchema = {
  component: Schema,
  props: {
    name: 'CustomRecursive',
    noncollapsible: true,
    value: objectWithCircularReference,
  },
}

export const enumSchema = {
  component: Schema,
  props: {
    name: 'CustomEnum',
    noncollapsible: true,
    value: {
      type: 'string',
      enum: ['foo', 'bar'],
      description: 'The enum value',
    },
  },
}

export const objectWithEnumSchema = {
  component: Schema,
  props: {
    name: 'ObjectWithEnum',
    noncollapsible: true,
    value: {
      type: 'object',
      properties: {
        enumValue: {
          type: 'string',
          enum: ['foo', 'bar'],
          description: 'The enum value',
        },
      },
    },
  },
}

export const discriminatorsSchema = {
  component: Schema,
  props: {
    name: 'CustomDiscriminator',
    noncollapsible: true,
    value: {
      anyOf: [
        {
          name: 'Foo',
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['foo'] },
            fooProperty: { type: 'string' },
          },
        },
        {
          name: 'Bar',
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['bar'] },
            barProperty: { type: 'number' },
          },
        },
      ],
    },
  },
}

export const complexAllOfSchema = {
  component: Schema,
  props: {
    name: 'ComplexAllOf',
    noncollapsible: true,
    value: {
      'description': 'The recording session list.',
      'allOf': [
        {
          'type': 'object',
          'properties': {
            'from': {
              'type': 'string',
              'description': 'The start date of the query date range.',
              'example': '2021-10-11',
            },
            'to': {
              'type': 'string',
              'description': 'The end date of the query date range.',
              'example': '2021-11-11',
            },
            'page_size': {
              'type': 'integer',
              'description': ' The number of records returned within a single API call.',
              'example': 30,
            },
            'total_records': {
              'type': 'integer',
              'description': 'The number of all records available across pages.',
              'example': 100,
            },
            'next_page_token': {
              'type': 'string',
              'description': 'The next page token to paginate through large result sets.',
              'example': 'Usse957pzxvmYwlmCZ50a6CNXFrhztxuj82',
            },
          },
        },
        {
          'type': 'object',
          'properties': {
            'sessions': {
              'title': 'Recording session list',
              'type': 'array',
              'description': 'List of recording sessions',
              'items': {
                'allOf': [
                  {
                    'type': 'object',
                    'properties': {
                      'session_id': {
                        'type': 'string',
                        'description':
                          'Unique session identifier. Each instance of the session will have its own `session_id`.',
                        'example': 'JZiFOknTQ4yH/tJgaUTlkg==',
                      },
                      'session_name': {
                        'type': 'string',
                        'description': 'Session name.',
                        'example': 'session_name',
                      },
                      'start_time': {
                        'type': 'string',
                        'description': 'The time at which the session started.',
                        'format': 'date-time',
                        'example': '2022-03-10T02:27:24Z',
                      },
                      'duration': {
                        'type': 'integer',
                        'description': 'Session duration.',
                        'example': 2,
                      },
                      'total_size': {
                        'type': 'integer',
                        'description':
                          'The total file size of the recording. This includes the `recording_files` and `participant_audio_files` files.',
                        'format': 'int64',
                        'example': 444601,
                      },
                      'recording_count': {
                        'type': 'integer',
                        'description':
                          'Number of recording files returned in the response of this API call. This includes the `recording_files` and  `participant_audio_files` files.',
                        'example': 4,
                      },
                      'session_key': {
                        'type': 'string',
                        'description': 'The Video SDK custom session ID.',
                        'example': 'ABC36jaBI145',
                      },
                    },
                  },
                  {
                    'type': 'object',
                    'description': 'List of recording files.',
                    'allOf': [
                      {
                        'type': 'object',
                        'properties': {
                          'recording_files': {
                            'title': 'Recording file list',
                            'type': 'array',
                            'description': 'List of recording files.',
                            'items': {
                              'allOf': [
                                {
                                  'type': 'object',
                                  'properties': {
                                    'id': {
                                      'type': 'string',
                                      'description':
                                        'The recording file ID. This is included in the general query response.',
                                      'example': '35497738-9fef-4f8a-97db-0ec34caef065',
                                    },
                                    'recording_start': {
                                      'type': 'string',
                                      'description': 'The recording start time.',
                                      'example': '2022-03-11T12:34:39Z',
                                    },
                                    'recording_end': {
                                      'type': 'string',
                                      'description':
                                        'The recording end time. This is included in the the general query response.',
                                      'example': '2022-03-11T12:34:42Z',
                                    },
                                    'file_type': {
                                      'type': 'string',
                                      'description':
                                        "The recording file type. The value of this field could be one of the following:  \n \n`MP4`: Video file of the recording.  \n `M4A` Audio-only file of the recording.  \n `TIMELINE`: Timestamped file of the recording in JSON file format. To get a timeline file, the 'Add a timestamp to the recording'. You must enable this setting in the recording settings. See [Video SDK Account: Enable cloud recording](https://developers.zoom.us/docs/video-sdk/account/#enable-cloud-recording) for details). The time will display in the account's timezone, set in their Zoom profile.\n  \n  `TRANSCRIPT`: Transcription file of the recording in VTT format.  \n  `CHAT`: A TXT file containing in-session chat messages that were sent during the session.  \n `CC`: File containing closed captions of the recording in VTT file format.  \n `CSV`: File containing polling data in CSV format.\n\n  \n \n\nA recording file object with file type of either `CC` or `TIMELINE` **does not have** the following properties: `id`, `status`, `file_size`, and `recording_type`.",
                                      'example': 'MP4',
                                    },
                                    'file_size': {
                                      'type': 'number',
                                      'description': 'The recording file size.',
                                      'example': 12125,
                                    },
                                    'download_url': {
                                      'type': 'string',
                                      'description':
                                        'The URL to download the recording. \n\nTo access a private or password-protected cloud recording of a user in your account, use your [Video SDK API JWT](https://developers.zoom.us/docs/video-sdk/auth/#generate-a-video-sdk-jwt). Set this JWT as a Bearer token in the Authorization header of your HTTP request. For example: \n\n `curl "{download_url}" --header "authorization: Bearer {JWT}" --header "content-type: application/json"`.\n\nNote: The download_url may be a redirect. In that case, use `curl --location "{download_url}"` to follow redirects or use another tool, like Postman.',
                                      'example': 'https://example.com/download_url',
                                    },
                                    'status': {
                                      'type': 'string',
                                      'description': 'The recording status.',
                                      'example': 'completed',
                                      'enum': ['completed'],
                                    },
                                    'deleted_time': {
                                      'type': 'string',
                                      'description':
                                        'The time at which the recording was deleted. Returned in the response only for the trash query.',
                                      'example': '2022-03-28T07:22:22Z',
                                    },
                                    'recording_type': {
                                      'type': 'string',
                                      'description':
                                        'The recording type. The value of this field can be one of the following:  \n `shared_screen_with_speaker_view(CC)`  \n `shared_screen_with_speaker_view`  \n `shared_screen_with_gallery_view`  \n `active_speaker`  \n `gallery_view`  \n `shared_screen`  \n `audio_only`  \n `audio_transcript`  \n `chat_file`  \n `poll`  \n `timeline`  \n `closed_caption`  \n `local_transcript`  \n `original_transcript`',
                                      'example': 'audio_only',
                                    },
                                  },
                                  'description': 'Recording file object.',
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    'type': 'object',
                    'description': 'Return a list of recording files about individual video for each participant.',
                    'items': {
                      'allOf': [
                        {
                          'type': 'object',
                          'properties': {
                            'participant_video_files': {
                              'title': 'The list of recording files for each participant.',
                              'type': 'array',
                              'description':
                                'A list of recording files. The API only returns this response when the **Record a separate audio file of each participant** setting is enabled.',
                              'items': {
                                'allOf': [
                                  {
                                    'type': 'object',
                                    'properties': {
                                      'id': {
                                        'type': 'string',
                                        'description':
                                          "The recording file's unique ID. This is included in the general query response.",
                                        'example': '24698bd1-589e-4c33-9ba3-bc788b2a0ac2',
                                      },
                                      'recording_start': {
                                        'type': 'string',
                                        'description': "The recording file's start time.",
                                        'format': 'date-time',
                                        'example': '2021-12-07T05:42:13Z',
                                      },
                                      'recording_end': {
                                        'type': 'string',
                                        'description':
                                          "The recording file's end time. This is included in the general query response.",
                                        'format': 'date-time',
                                        'example': '2021-12-07T05:42:28Z',
                                      },
                                      'file_name': {
                                        'type': 'string',
                                        'description': "The recording file's name.",
                                        'example': 'recording_name',
                                      },
                                      'file_type': {
                                        'type': 'string',
                                        'description':
                                          "The recording file's format. One of:\n\n* `MP4` - Video file.\n* `M4A` - Audio-only file.\n* `TIMELINE` - Timestamp file of the recording, in JSON file format. To get a timeline file, you must enable the **Add a timestamp to the recording** setting in the recording settings. See [Video SDK Account: Enable could recording](https://developers.zoom.us/docs/video-sdk/account/#enable-cloud-recording) for details. The time will display in the account's timezone.\n* `TRANSCRIPT` - A transcript of the recording, in VTT format.\n* `CHAT` - A text file containing chat messages sent during the session.\n* `CC` - A file containing the closed captions of the recording, in VTT file format.\n* `CSV` - A file containing polling data, in CSV format.\n\nA recording file object with file type of either `CC` or `TIMELINE` **does not have** the following properties: `id`, `status`, `file_size`, and `recording_type`.",
                                        'example': 'MP4',
                                      },
                                      'file_extension': {
                                        'type': 'string',
                                        'description': "The archived file's file extension.",
                                        'example': 'MP4',
                                      },
                                      'file_size': {
                                        'type': 'number',
                                        'description': "The recording file's size, in bytes.",
                                        'example': 900452,
                                      },
                                      'download_url': {
                                        'type': 'string',
                                        'description':
                                          'The URL to download the recording. \n\nTo access a private or password-protected cloud recording of a user in your account, use your [Video SDK API JWT](https://developers.zoom.us/docs/video-sdk/auth/#generate-a-video-sdk-jwt). Set this JWT as a Bearer token in the Authorization header of your HTTP request. For example: \n\n `curl "{download_url}" --header "authorization: Bearer {JWT}" --header "content-type: application/json"`.\n\nNote: The download_url may be a redirect. In that case, use `curl --location "{download_url}"` to follow redirects or use another tool, like Postman.',
                                        'example': 'https://download.example.com/download_url',
                                      },
                                      'recording_type': {
                                        'type': 'string',
                                        'description':
                                          'The type of recording file: \n* `individual_user` \n* `individual_shared_screen`.',
                                        'example': 'individual_shared_screen',
                                        'enum': ['individual_user', 'individual_shared_screen'],
                                      },
                                      'status': {
                                        'type': 'string',
                                        'description': "The recording file's status.",
                                        'example': 'completed',
                                        'enum': ['completed'],
                                      },
                                      'user_id': {
                                        'type': 'string',
                                        'description':
                                          "The participant's session user ID. This value is assigned to a participant upon joining a session and is only valid for the duration of the session.",
                                        'example': 'abcd1234',
                                      },
                                      'user_key': {
                                        'type': 'string',
                                        'description':
                                          "The participant's SDK identifier. Set with the `user_identity` key in the Video SDK JWT payload. This value can be alphanumeric, up to a maximum length of 36 characters.",
                                        'example': 'efgh5678',
                                      },
                                    },
                                    'description': 'The recording file object.',
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
  },
}
