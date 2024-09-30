import requests
import sys

token = sys.argv[1]
for i in range(100):
    r_json = {
        'name': 'myFile{}'.format(7 + i),
        'type': 'file',
        'isPublic': True,
        'data': 'SGVsbG8gV2Vic3RhY2shCg==',
        'parentId': sys.argv[2]
    }
    res = requests.post('http://0.0.0.0:5000/files', json=r_json, headers={'X-Token': token})
    print(res.json())
