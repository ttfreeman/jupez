import pandas as pd
from google.cloud import firestore
from google.cloud import storage
from datetime import datetime

# API clients
gcs = None
db = None


def analyze_html(data, context):
    scraped_html = get_gcs_file_contents(data)
    analysis_result = parse_html(data, scraped_html)
    docref_list = persist(analysis_result, data['name'])
    print('Created new Firestore documents',
                len(docref_list))


def get_gcs_file_contents(data):
  """Get the content of the GCS object that triggered this function."""
  global gcs
  if not gcs:
    gcs = storage.Client()
  bucket = gcs.get_bucket(data['bucket'])
  blob = bucket.blob(data['name'])
  return blob.download_as_string()


def parse_html(data, html):
  """Parse the supplied HTML and return a dict with details of the operation."""
  gcs_filename = 'gs://{}/{}'.format(data['bucket'], data['name'])
  parse_result = {'input_file': gcs_filename,
                  'analysis_timestamp': datetime.utcnow().isoformat() + 'Z'}
  options = extract_data(html)
  if options:
    parse_result['status'] = 'SUCCESS'
    parse_result['latest_options'] = options
  else:
    logging.warning('FAILED analysis of %s', gcs_filename)
    parse_result['status'] = 'FAILED'
  return parse_result


def persist(analysis_result, collection_id):
    # print('analysis_result: ', analysis_result['latest_options'])
    global db
    insert_list=[]
    if not db:
        db = firestore.Client()
    collection_name ='jupez-scrape-analysis'
    coll_ref = db.collection(collection_name)
    empty_collection(coll_ref, 1000)

    for option in analysis_result['latest_options']:
        document_id = option['symbol']+option['expirationDate']+str(option['strikePrice'])
        inserted = coll_ref.add(option, document_id)
        insert_list.append(inserted[1])
    return insert_list
    # [END main-block]


# [START parse-block]
def parse_html(data, html):
  """Parse the supplied HTML and return a dict with details of the operation."""
  gcs_filename = 'gs://{}/{}'.format(data['bucket'], data['name'])
  parse_result = {'input_file': gcs_filename,
                  'analysis_timestamp': datetime.utcnow().isoformat() + 'Z'}
  options = extract_data(html)
  if options:
    parse_result['status'] = 'SUCCESS'
    parse_result['latest_options'] = options
  else:
    logging.warning('FAILED analysis of %s', gcs_filename)
    parse_result['status'] = 'FAILED'
  return parse_result


def extract_data(html):

  dfs = pd.read_html(html, header=None)
  dfs[2].columns = [ 
    "expirationDate",
    "call-closingPrice",
    "call-chg",
    "call-bid",
    "call-ask",
    "call-volume",
    "call-openInterest",
    "symbol",
    "strikePrice",
    "put-expirationDate",
    "put-closingPrice",
    "put-chg",
    "put-bid",
    "put-ask",
    "put-volume",
    "put-openInterest"
  ]   

  df = dfs[2].drop(columns=['call-chg', 'put-expirationDate', 'put-chg'])
    
  print(df.head())
  print('shape of dataframe=', df.shape)

  return df.to_dict(orient='records')


def empty_collection(coll_ref, batch_size):
  
  docs = coll_ref.limit(1000).get()
  deleted = 0

  for doc in docs:
      print(u'Deleting doc {} => {}'.format(doc.id, doc.to_dict()))
      doc.reference.delete()
      deleted = deleted + 1

  # if deleted >= batch_size:
  #     return empty_collection(coll_ref, batch_size)