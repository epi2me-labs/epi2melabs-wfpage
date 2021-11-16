import os
import json
import shutil
import shortuuid
from dataclasses import dataclass
from typing import Dict, Union, Tuple
from nf_core.schema import PipelineSchema
from jsonschema.validators import validator_for
from jupyterlab_nextflow.invoker import LocalInvoker
from jupyterlab_nextflow.database import get_session, Instance


class LauncherException(Exception):

    def __init__(self, message):
        super(LauncherException, self).__init__(message)


@dataclass
class Workflow:
    name: str
    desc: str
    path: str
    schema: Dict
    defaults: Dict

    def to_dict(self):
        return {
            'name': self.name,
            'desc': self.desc,
            'path': self.path,
            'schema': self.schema,
            'defaults': self.defaults}


class Launcher:
    MAINNF: str = 'main.nf'
    PARAMS: str = 'params.json'
    
    def __init__(self, port: str='9021') -> None:
        self.port = port
        self._workflows: Dict[str, Workflow] = {}

        self.base_dir = os.path.join(os.getcwd(), 'epi2melabs')
        self.instance_dir = os.path.join(self.base_dir, 'instances')
        self.workflows_dir = os.path.join(self.base_dir, 'workflows')
        self.database_uri = f'sqlite:///{self.base_dir}/db.sqlite'

        self.db = get_session(self.database_uri)
        self.invoker = LocalInvoker(self.database_uri)

        self.get_or_create_dir(self.base_dir)
        self.get_or_create_dir(self.instance_dir)
        self.get_or_create_dir(self.workflows_dir)

    #
    # Workflows
    #
    @property
    def workflows(self) -> Dict:
        for item in os.listdir(self.workflows_dir):
            if self._workflows.get(item):
                continue
            path = os.path.join(self.workflows_dir, item)
            if not os.path.isdir(path):
                continue
            if not self.MAINNF in os.listdir(path):
                continue
            try:
                self._workflows[item] = self.load_workflow(
                    item, path)
            except LauncherException:
                pass
        return {
            workflow.name: workflow.to_dict()
            for workflow in self._workflows.values()
        }

    def get_workflow(self, name: str) -> Dict:
        if workflow := self._get_workflow(name):
            return workflow.to_dict()
        return {}

    def _get_workflow(self, name: str) -> Union[Workflow, None]:
        if workflow := self._workflows.get(name):
            return workflow
        return None

    def load_workflow(self, name: str, path: str) -> Workflow:
        nfcore = PipelineSchema()
        nfcore.get_schema_path(path)
        nfcore.load_schema()
        nfcore.get_schema_defaults()

        if not nfcore.schema:
            raise LauncherException(
                f'Cannot reload {name}: missing schema')

        return Workflow(
            name = name,
            desc = 'Placeholder description',
            path = path,
            schema = nfcore.schema,
            defaults = nfcore.schema_defaults)

    #
    # Instances
    #
    @property
    def instances(self) -> Dict:
        return {
            instance.id: instance.to_dict()
            for instance in self.db.query(Instance).all()
        }

    def get_instance(self, id: str) -> Dict:
        if instance := self._get_instance(id):
            return instance.to_dict()
        return {}

    def _get_instance(self, id: str) -> Union[Instance, None]:
        if instance := self.db.query(Instance).get(id):
            return instance
        return None

    def create_instance(self, workflow: Workflow, params: Dict) -> Tuple[Instance, Dict]:
        # Create a new directory with a uuid name
        id = str(shortuuid.uuid())
        name = '-'.join([workflow.name, id])
        path = os.path.join(self.instance_dir, name)

        # Create a new database entry
        instance = Instance(id, path, workflow.name)
        self.db.add(instance)
        self.db.commit()

        # Make a directory
        self.get_or_create_dir(path)
        
        # Doctor params if necessary
        if params.get('out_dir'):
            params['out_dir'] = os.path.join(path, 'output')
        for param_key, param_value in params.items():
            try:
                params[param_key] = int(param_value)
            except (ValueError, TypeError):
                pass

        # Write the params to json
        params_path = os.path.join(path, self.PARAMS)
        with open(params_path, 'w') as json_file:
            json_file.write(json.dumps(params, indent=4))

        return instance, params

    def delete_instance(self, id: str) -> bool:
        instance = self._get_instance(id)
        if not instance:
            return False

        # Delete the directory
        try:
            shutil.rmtree(instance.path)
        except FileNotFoundError:
            pass

        # Stop any process
        self.invoker.stop(instance.id)

        # Delete record
        self.db.delete(instance)
        self.db.commit()

        return True

    def launch(self, workflow_name: str, params: Dict) -> Tuple[bool, Dict]:
        workflow = self._get_workflow(workflow_name)

        if not workflow:
            return False, {}

        instance, params = self.create_instance(workflow, params)
        
        self.invoker.start(
            self._pre_launch(workflow, instance, params),
            instance.id)

        return True, instance.to_dict()

    def _pre_launch(self, workflow: Workflow, instance: Instance, params: Dict) -> str:
        main_file = os.path.join(workflow.path, self.MAINNF)
        params_file = os.path.join(instance.path, self.PARAMS)
        logs_file = os.path.join(instance.path, 'nextflow.stdout')
        work_dir = os.path.join(params['out_dir'], 'work')

        # Touch the logs file, as the frontend might want to access
        # it before nextflow has even started
        with open(logs_file, 'a'):
            pass

        # Create the output folder
        self.get_or_create_dir(params['out_dir'])

        command = (
            f'nextflow run {main_file} -params-file {params_file} '
            f'-w {work_dir} > {logs_file}'
        )
        
        return command

    #
    # Validation
    #
    def validate(self, workflow, params):
        nfcore = PipelineSchema()
        nfcore.get_schema_path(workflow.path)
        nfcore.load_schema()
        nfcore.input_params.update(params)
        valid, errors = self._validate(nfcore.input_params, nfcore.schema)
        return valid, errors

    def _validate(self, instance, schema, *args, **kwargs):
        errors = {}
        cls = validator_for(schema)
        cls.check_schema(schema)
        validator = cls(schema, *args, **kwargs)
        for error in validator.iter_errors(instance):
            split_message = error.message.split("'")
            errors[split_message[1]] = error.message
        return bool(errors), errors

    #
    # Helpers
    #
    def get_or_create_dir(self, path):
        if not os.path.exists(path):
            os.mkdir(path)
            return True, os.path.abspath(path)
        return False, os.path.abspath(path)