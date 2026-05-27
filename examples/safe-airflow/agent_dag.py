from airflow import DAG
from openai import OpenAI

client = OpenAI()
summary = client.chat.completions.create(model="gpt-4.1", messages=[])

# Safe fixture: no BashOperator, DockerOperator, KubernetesPodOperator, HTTP operator, or deployment call.
