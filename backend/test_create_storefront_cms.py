import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
django.setup()

from saleor.graphql.api import schema
from saleor.account.models import User

admin = User.objects.filter(is_superuser=True).first()
context = type('Req', (), {'user': admin, 'app': None})()

def run_gql(query, variables=None):
    res = schema.execute(query, variables=variables or {}, context_value=context)
    if res.errors:
        print("GQL Errors:", res.errors)
    return res.data

# Test creating an attribute
attr_mutation = """
mutation AttributeCreate($input: AttributeCreateInput!) {
  attributeCreate(input: $input) {
    attribute {
      id
      slug
      name
    }
    errors {
      field
      message
      code
    }
  }
}
"""

res = run_gql(attr_mutation, {
    "input": {
        "name": "Hero Eyebrow Test",
        "slug": "hero-eyebrow-test",
        "type": "PAGE_TYPE",
        "inputType": "PLAIN_TEXT"
    }
})
print("Attribute create result:", res)
