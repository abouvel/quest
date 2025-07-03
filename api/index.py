import sys
import os

# Ensure the lib directory is in the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'lib'))

from multiagent.state import app 