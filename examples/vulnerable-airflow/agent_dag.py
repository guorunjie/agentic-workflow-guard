from airflow import DAG
from airflow.operators.bash import BashOperator
from openai import OpenAI

client = OpenAI()
decision = client.chat.completions.create(model="gpt-4.1", messages=[])

deploy = BashOperator(
    task_id="deploy_model_decision",
    bash_command="kubectl apply -f deployment.yaml",
)
