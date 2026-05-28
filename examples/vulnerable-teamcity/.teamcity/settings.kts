import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script

version = "2024.12"

project {
  buildType {
    name = "agent deploy"
    params {
      password("env.DEPLOY_TOKEN", "credentialsJSON:production-token")
    }
    steps {
      script {
        scriptContent = """
          PROMPT="Review %teamcity.build.branch% and choose deploy commands"
          AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
          bash -lc "$AGENT_OUTPUT"
        """
      }
    }
  }
}
